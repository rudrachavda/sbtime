import { DateTime } from "luxon";

import {
  EnrollmentImportModel,
  SectionModel,
  TermModel,
} from "@repo/common/models";

import { REGULAR_SESSION_ID } from "../lib/ucsb-catalog";
import {
  UCSBPLAT_REQUEST_DELAY_MS,
  fetchUcsbplatPage,
  isChallengePage,
} from "../lib/ucsbplat-course";
import {
  chartToEntries,
  classPageUrl,
  parseClassEnrollmentPage,
  ucsbplatClassCode,
} from "../lib/ucsbplat-enrollment";
import {
  recordedRanges,
  saveImportedHistory,
} from "../lib/ucsbplat-history-store";
import { Config } from "../shared/config";

/** Bookkeeping key in enrollmentimports (one record per lecture). */
const SOURCE = "ucsbplat-class";

/** A lecture is read again after this long, to fill any new gaps. */
const REFRESH_AFTER_DAYS = 7;

const MAX_CONSECUTIVE_ERRORS = 5;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fill in seat counts for the current and upcoming quarters from UCSBPlat's
 * class pages (its past enrollment trends page only lists earlier
 * offerings). Only days SBTime didn't record itself are filled: the days
 * before we started recording a quarter, and any day the scheduler was off.
 *
 * Works on whatever quarters are current or upcoming, one page every two
 * seconds, and stops at the first sign of being blocked. Resumable and safe
 * to rerun: lectures read in the last week are skipped.
 *
 * Environment:
 *   ENROLLMENT_IMPORT_LIMIT  stop after this many lectures (default: no limit)
 */
const importCurrentEnrollment = async (config: Config) => {
  const { log } = config;
  const limit = parseInt(process.env.ENROLLMENT_IMPORT_LIMIT ?? "", 10);

  const terms = await TermModel.find(
    {
      temporalPosition: { $in: ["Current", "Future"] },
      hasCatalogData: true,
    },
    { id: 1, beginDate: 1 }
  )
    .sort({ id: 1 })
    .lean();

  const freshSince = new Date(
    Date.now() - REFRESH_AFTER_DAYS * 24 * 60 * 60 * 1000
  );
  const fresh = new Set(
    await EnrollmentImportModel.distinct("courseId", {
      source: SOURCE,
      fetchedAt: { $gte: freshSince },
    })
  );

  type Pending = {
    key: string;
    termId: string;
    begin: DateTime;
    enrollCode: string;
    lecture: {
      sectionId: string;
      number: string;
      subject: string;
      courseNumber: string;
      year: number;
      semester: string;
    };
  };
  let pending: Pending[] = [];

  for (const term of terms) {
    const sections = await SectionModel.find(
      { termId: term.id },
      {
        sectionId: 1,
        number: 1,
        primary: 1,
        courseId: 1,
        classNumber: 1,
        subject: 1,
        courseNumber: 1,
        year: 1,
        semester: 1,
      }
    ).lean();

    // One UCSBPlat class page per class (a lecture and its sections).
    const classes = new Map<string, typeof sections>();
    for (const section of sections) {
      const classKey = `${section.courseId}|${section.classNumber}`;
      classes.set(classKey, [...(classes.get(classKey) ?? []), section]);
    }

    const begin = DateTime.fromISO(term.beginDate, {
      zone: "America/Los_Angeles",
    });

    for (const classSections of classes.values()) {
      const lecture = classSections.find((section) => section.primary);
      const enrollCode = ucsbplatClassCode(classSections);
      if (!lecture || !enrollCode) continue;

      const key = `${term.id}:${lecture.sectionId}`;
      if (fresh.has(key)) continue;

      pending.push({ key, termId: term.id, begin, enrollCode, lecture });
    }
  }

  log.info(
    `${terms.map((term) => term.id).join(", ")}: ${pending.length.toLocaleString()} lectures to read from UCSBPlat.`
  );
  if (Number.isFinite(limit) && limit > 0) pending = pending.slice(0, limit);

  const totals = { read: 0, filled: 0, days: 0, noChart: 0, missing: 0 };
  let consecutiveErrors = 0;

  for (const [index, item] of pending.entries()) {
    if (index > 0) await sleep(UCSBPLAT_REQUEST_DELAY_MS);

    const { lecture } = item;
    const result = await fetchUcsbplatPage(
      classPageUrl(lecture.year, lecture.semester, item.enrollCode)
    );

    if (result.status === "blocked") {
      log.error(
        "UCSBPlat blocked the request or asked for verification. Stopping; what was imported so far is saved."
      );
      break;
    }
    if (result.status === "error") {
      consecutiveErrors++;
      log.warn(`Could not read ${item.key}: ${result.message}`);
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        log.error(
          `Stopping after ${MAX_CONSECUTIVE_ERRORS} failures in a row.`
        );
        break;
      }
      continue;
    }
    consecutiveErrors = 0;

    let days = 0;
    if (result.status === "missing") {
      totals.missing++;
    } else {
      const chart = parseClassEnrollmentPage(
        result.body,
        `${lecture.semester} ${lecture.year}`
      );
      if (!chart && isChallengePage(result.body)) {
        log.error(
          "UCSBPlat asked for verification. Stopping; what was imported so far is saved."
        );
        break;
      }

      if (!chart) {
        totals.noChart++;
      } else {
        const sectionKey = {
          termId: item.termId,
          sessionId: REGULAR_SESSION_ID,
          sectionId: lecture.sectionId,
        };
        const entries = chartToEntries(
          chart,
          item.begin,
          await recordedRanges(sectionKey)
        );
        await saveImportedHistory(
          {
            ...sectionKey,
            year: lecture.year,
            semester: lecture.semester,
            subject: lecture.subject,
            courseNumber: lecture.courseNumber,
            sectionNumber: lecture.number,
          },
          entries
        );
        days = chart.labels.length;
        if (entries.length > 0) totals.filled++;
      }
    }

    await EnrollmentImportModel.updateOne(
      { source: SOURCE, courseId: item.key },
      {
        $set: {
          fetchedAt: new Date(),
          pages: 1,
          charts: days > 0 ? 1 : 0,
          matched: days > 0 ? 1 : 0,
          unmatched: 0,
        },
      },
      { upsert: true }
    );

    totals.read++;
    totals.days += days;
    if ((index + 1) % 100 === 0) {
      log.trace(`  ${index + 1} / ${pending.length} lectures`);
    }
  }

  const n = (value: number) => value.toLocaleString();
  log.info(
    `Read ${n(totals.read)} lectures: ${n(totals.filled)} got history for days SBTime missed, ${n(totals.noChart)} had no chart on UCSBPlat, ${n(totals.missing)} not on UCSBPlat.`
  );
};

export default { importCurrentEnrollment };
