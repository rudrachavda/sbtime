import { DateTime } from "luxon";

import {
  ClassModel,
  EnrollmentImportModel,
  IEnrollmentHistoryItem,
  NewEnrollmentHistoryModel,
  SectionModel,
  TermModel,
} from "@repo/common/models";

import { REGULAR_SESSION_ID } from "../lib/ucsb-catalog";
import { EnrollmentEntry } from "../lib/ucsb-enrollment";
import {
  UCSBPLAT_REQUEST_DELAY_MS,
  fetchUcsbplatPage,
  isChallengePage,
} from "../lib/ucsbplat-course";
import {
  ENROLLMENT_SOURCE,
  EnrollmentChart,
  chartToEntries,
  matchChartToSection,
  parsePastEnrollmentPage,
  pastEnrollmentUrl,
  quarterLabelToTermId,
  ucsbplatClassCode,
} from "../lib/ucsbplat-enrollment";
import { Config } from "../shared/config";

/** UCSBPlat started recording in Winter 2024. */
const FIRST_QUARTER = "20241";

/** Imported courses are refreshed after this long. */
const REFRESH_AFTER_DAYS = 30;

const MAX_CONSECUTIVE_ERRORS = 5;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Fetched =
  | { status: "ok"; charts: EnrollmentChart[]; pages: number }
  | { status: "missing" }
  | { status: "blocked" }
  | { status: "error"; message: string };

/** Read every page of a course's past enrollment trends. */
const fetchCourseCharts = async (
  year: number,
  season: string,
  enrollCode: string
): Promise<Fetched> => {
  const charts: EnrollmentChart[] = [];
  let lastPage = 1;

  for (let page = 1; page <= lastPage; page++) {
    if (page > 1) await sleep(UCSBPLAT_REQUEST_DELAY_MS);

    const result = await fetchUcsbplatPage(
      pastEnrollmentUrl(year, season, enrollCode, page)
    );
    if (result.status !== "ok") {
      // A missing first page means UCSBPlat has no history for the course.
      if (result.status === "missing" && page > 1) break;
      return result;
    }

    const parsed = parsePastEnrollmentPage(result.body);
    if (parsed.charts.length === 0 && isChallengePage(result.body)) {
      return { status: "blocked" };
    }

    charts.push(...parsed.charts);
    if (page === 1) lastPage = parsed.lastPage;
  }

  return { status: "ok", charts, pages: lastPage };
};

/**
 * Store imported history for one section: earlier imports from the same
 * source are replaced, SBTime's own entries are kept, oldest first.
 */
const saveHistory = async (
  identity: Omit<IEnrollmentHistoryItem, "history">,
  imported: EnrollmentEntry[]
) => {
  const existing = await NewEnrollmentHistoryModel.findOne(
    {
      termId: identity.termId,
      sessionId: identity.sessionId,
      sectionId: identity.sectionId,
    },
    { history: 1 }
  ).lean();

  const history = [
    ...(existing?.history ?? []).filter(
      (entry) => entry.source !== ENROLLMENT_SOURCE
    ),
    ...imported,
  ].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  await NewEnrollmentHistoryModel.updateOne(
    {
      termId: identity.termId,
      sessionId: identity.sessionId,
      sectionId: identity.sectionId,
    },
    { $set: { ...identity, history } },
    { upsert: true }
  );
};

/**
 * Import past enrollment history from UCSBPlat for every course offered since
 * Winter 2024. One page every two seconds; stops at the first sign of being
 * blocked. Resumable: courses imported recently are skipped.
 *
 * Environment:
 *   ENROLLMENT_IMPORT_LIMIT  stop after this many courses (default: no limit)
 */
const importEnrollmentHistory = async (config: Config) => {
  const { log } = config;
  const limit = parseInt(process.env.ENROLLMENT_IMPORT_LIMIT ?? "", 10);

  // Each course's newest class since Winter 2024: its page lists every
  // earlier offering.
  const newest = await ClassModel.aggregate<{
    _id: string;
    termId: string;
    year: number;
    semester: string;
    number: string;
  }>([
    { $match: { termId: { $gte: FIRST_QUARTER } } },
    { $sort: { termId: -1, number: 1 } },
    {
      $group: {
        _id: "$courseId",
        termId: { $first: "$termId" },
        year: { $first: "$year" },
        semester: { $first: "$semester" },
        number: { $first: "$number" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const freshSince = new Date(
    Date.now() - REFRESH_AFTER_DAYS * 24 * 60 * 60 * 1000
  );
  const done = new Set(
    await EnrollmentImportModel.distinct("courseId", {
      source: ENROLLMENT_SOURCE,
      fetchedAt: { $gte: freshSince },
    })
  );

  let pending = newest.filter((course) => !done.has(course._id));
  log.info(
    `${newest.length.toLocaleString()} courses offered since Winter 2024, ${pending.length.toLocaleString()} to import from UCSBPlat.`
  );
  if (Number.isFinite(limit) && limit > 0) pending = pending.slice(0, limit);

  const termBegin = new Map(
    (await TermModel.find({}, { id: 1, beginDate: 1 }).lean()).map((term) => [
      term.id,
      DateTime.fromISO(term.beginDate, { zone: "America/Los_Angeles" }),
    ])
  );

  const totals = {
    courses: 0,
    charts: 0,
    matched: 0,
    unmatched: 0,
    missing: 0,
  };
  let consecutiveErrors = 0;

  for (const [index, course] of pending.entries()) {
    if (index > 0) await sleep(UCSBPLAT_REQUEST_DELAY_MS);

    const sections = await SectionModel.find(
      {
        termId: course.termId,
        courseId: course._id,
        classNumber: course.number,
      },
      { number: 1, sectionId: 1, primary: 1 }
    ).lean();
    const enrollCode = ucsbplatClassCode(sections);
    if (!enrollCode) continue;

    const fetched = await fetchCourseCharts(
      course.year,
      course.semester,
      enrollCode
    );

    if (fetched.status === "blocked") {
      log.error(
        "UCSBPlat blocked the request or asked for verification. Stopping; what was imported so far is saved."
      );
      break;
    }

    if (fetched.status === "error") {
      consecutiveErrors++;
      log.warn(`Could not read history for ${course._id}: ${fetched.message}`);
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        log.error(
          `Stopping after ${MAX_CONSECUTIVE_ERRORS} failures in a row.`
        );
        break;
      }
      continue;
    }
    consecutiveErrors = 0;

    const charts = fetched.status === "ok" ? fetched.charts : [];
    if (fetched.status === "missing") totals.missing++;

    // Match charts to lectures, one quarter at a time.
    let matched = 0;
    const byTerm = new Map<string, EnrollmentChart[]>();
    for (const chart of charts) {
      const termId = quarterLabelToTermId(chart.quarter);
      if (termId) byTerm.set(termId, [...(byTerm.get(termId) ?? []), chart]);
    }

    for (const [termId, termCharts] of byTerm) {
      const begin = termBegin.get(termId);
      if (!begin) continue;

      const lectures = await SectionModel.find(
        { termId, courseId: course._id, primary: true },
        {
          sectionId: 1,
          meetings: 1,
          subject: 1,
          courseNumber: 1,
          number: 1,
          year: 1,
          semester: 1,
        }
      ).lean();

      const bySection = new Map<string, EnrollmentEntry[]>();
      for (const chart of termCharts) {
        const sectionId = matchChartToSection(chart, lectures);
        if (!sectionId) continue;
        bySection.set(sectionId, [
          ...(bySection.get(sectionId) ?? []),
          ...chartToEntries(chart, begin),
        ]);
      }

      for (const [sectionId, entries] of bySection) {
        const lecture = lectures.find((l) => l.sectionId === sectionId)!;
        await saveHistory(
          {
            termId,
            year: lecture.year,
            semester: lecture.semester,
            sessionId: REGULAR_SESSION_ID,
            sectionId,
            subject: lecture.subject,
            courseNumber: lecture.courseNumber,
            sectionNumber: lecture.number,
          },
          entries
        );
        matched++;
      }
    }

    await EnrollmentImportModel.updateOne(
      { source: ENROLLMENT_SOURCE, courseId: course._id },
      {
        $set: {
          fetchedAt: new Date(),
          pages: fetched.status === "ok" ? fetched.pages : 0,
          charts: charts.length,
          matched,
          unmatched: charts.length - matched,
        },
      },
      { upsert: true }
    );

    totals.courses++;
    totals.charts += charts.length;
    totals.matched += matched;
    totals.unmatched += charts.length - matched;

    if ((index + 1) % 50 === 0) {
      log.trace(`  ${index + 1} / ${pending.length} courses`);
    }
  }

  log.info(
    `Imported ${totals.courses.toLocaleString()} courses: ${totals.matched.toLocaleString()} of ${totals.charts.toLocaleString()} charts matched to a lecture, ${totals.unmatched.toLocaleString()} unmatched, ${totals.missing.toLocaleString()} courses with no history on UCSBPlat.`
  );
};

export default { importEnrollmentHistory };
