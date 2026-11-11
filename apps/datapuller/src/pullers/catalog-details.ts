import {
  ClassModel,
  CourseCatalogDetailModel,
  CourseModel,
  ICourseCatalogDetailItem,
  TermModel,
} from "@repo/common/models";

import { refreshCatalogClasses } from "../lib/catalog-denormalize";
import {
  CATALOG_REQUEST_DELAY_MS,
  fetchCatalogCourse,
} from "../lib/ucsb-course-catalog";
import {
  UCSBPLAT_REQUEST_DELAY_MS,
  fetchUcsbplatCourse,
} from "../lib/ucsbplat-course";
import { Config } from "../shared/config";

/** Where course pages can be read from. */
const SOURCES = {
  // A UCSB student project with small, fast course pages.
  ucsbplat: {
    label: "UCSBPlat",
    fetch: fetchUcsbplatCourse,
    delayMs: UCSBPLAT_REQUEST_DELAY_MS,
  },
  // UCSB's General Catalog. Its firewall challenges automated readers after
  // roughly a hundred pages, so this is only good for small batches.
  catalog: {
    label: "General Catalog",
    fetch: fetchCatalogCourse,
    delayMs: CATALOG_REQUEST_DELAY_MS,
  },
} as const;

type SourceName = keyof typeof SOURCES;

/** Cached pages are re-read after this long. */
const REFRESH_AFTER_DAYS = 90;

/** Stop if the catalog keeps failing, instead of hammering it. */
const MAX_CONSECUTIVE_ERRORS = 5;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Copy cached catalog details onto the courses and classes that use them.
 */
export const applyCourseDetails = async (
  details: ICourseCatalogDetailItem[]
) => {
  const found = details.filter((detail) => detail.found);
  if (found.length === 0) return;

  await CourseModel.bulkWrite(
    found.map((detail) => ({
      updateOne: {
        filter: { courseId: detail.courseId },
        update: {
          $set: {
            ...(detail.title ? { title: detail.title } : {}),
            ...(detail.description ? { description: detail.description } : {}),
            "preparation.requiredText": detail.prerequisites ?? null,
          },
        },
      },
    }))
  );

  await ClassModel.bulkWrite(
    found.map((detail) => ({
      updateMany: {
        filter: { courseId: detail.courseId },
        update: {
          $set: {
            ...(detail.title ? { title: detail.title } : {}),
            ...(detail.description ? { description: detail.description } : {}),
            requisites: detail.prerequisites ?? null,
          },
        },
      },
    }))
  );
};

/**
 * Read General Catalog pages for courses that have no cached details yet (or
 * stale ones), one request per second, then merge them into the catalog.
 *
 * Environment:
 *   CATALOG_DETAILS_SOURCE "ucsbplat" (default) or "catalog"
 *   CATALOG_DETAILS_LIMIT  stop after this many pages (default: no limit)
 *   CATALOG_DETAILS_SCOPE  "active" (default) reads courses offered in the
 *                          current and future quarters; "all" reads every
 *                          course in the database.
 */
const updateCourseDetails = async (config: Config) => {
  const { log } = config;

  const limit = parseInt(process.env.CATALOG_DETAILS_LIMIT ?? "", 10);
  const scope = process.env.CATALOG_DETAILS_SCOPE === "all" ? "all" : "active";
  const sourceName: SourceName =
    process.env.CATALOG_DETAILS_SOURCE === "catalog" ? "catalog" : "ucsbplat";
  const source = SOURCES[sourceName];

  let courseIds: string[];
  if (scope === "all") {
    courseIds = await CourseModel.distinct("courseId");
  } else {
    const activeTermIds = await TermModel.distinct("id", {
      temporalPosition: { $in: ["Current", "Future"] },
    });
    courseIds = await ClassModel.distinct("courseId", {
      termId: { $in: activeTermIds },
    });
  }

  const freshSince = new Date(
    Date.now() - REFRESH_AFTER_DAYS * 24 * 60 * 60 * 1000
  );
  // Skip courses that already have details, and courses this source has
  // already said it does not list. A miss from another source is retried.
  const cached = await CourseCatalogDetailModel.distinct("courseId", {
    fetchedAt: { $gte: freshSince },
    $or: [{ found: true }, { source: sourceName }],
  });
  const cachedSet = new Set(cached);

  let pending = courseIds.filter((id) => !cachedSet.has(id)).sort();
  log.info(
    `${courseIds.length.toLocaleString()} ${scope} courses, ${pending.length.toLocaleString()} without details to read from ${source.label}.`
  );

  if (Number.isFinite(limit) && limit > 0) pending = pending.slice(0, limit);
  if (pending.length === 0) return;

  log.info(
    `Reading ${pending.length.toLocaleString()} ${source.label} pages (about ${Math.ceil((pending.length * (source.delayMs + 400)) / 60000)} minutes)...`
  );

  const saved: ICourseCatalogDetailItem[] = [];
  let missing = 0;
  let errors = 0;
  let consecutiveErrors = 0;

  for (const [index, courseId] of pending.entries()) {
    const result = await source.fetch(courseId);

    if (result.status === "blocked") {
      log.error(
        `${source.label} blocked the request or asked for human verification, so it does not want automated reads right now. Stopping; what was read so far is saved.`
      );
      break;
    }

    if (result.status === "error") {
      errors++;
      consecutiveErrors++;
      log.warn(
        `Could not read ${source.label} page for ${courseId}: ${result.message}`
      );

      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        log.error(
          `Stopping after ${MAX_CONSECUTIVE_ERRORS} failures in a row; the site may be unavailable or have changed.`
        );
        break;
      }
    } else {
      consecutiveErrors = 0;

      const detail: ICourseCatalogDetailItem = {
        courseId,
        found: result.status === "found",
        fetchedAt: new Date(),
        source: sourceName,
        ...(result.status === "found" ? result.course : {}),
      };

      // Replace so fields the catalog dropped do not linger.
      await CourseCatalogDetailModel.replaceOne({ courseId }, detail, {
        upsert: true,
      });

      if (detail.found) saved.push(detail);
      else missing++;
    }

    if ((index + 1) % 50 === 0) {
      log.trace(`  ${index + 1} / ${pending.length} pages read`);
    }

    if (index < pending.length - 1) await sleep(source.delayMs);
  }

  log.info(
    `Catalog details: ${saved.length.toLocaleString()} found, ${missing.toLocaleString()} not in the catalog, ${errors.toLocaleString()} errors.`
  );

  if (saved.length === 0) return;

  await applyCourseDetails(saved);

  // Rebuild the catalog for every quarter that has classes for these courses.
  const affected = await ClassModel.aggregate<{
    _id: { year: number; semester: string };
  }>([
    { $match: { courseId: { $in: saved.map((detail) => detail.courseId) } } },
    { $group: { _id: { year: "$year", semester: "$semester" } } },
  ]);

  for (const { _id } of affected) {
    await refreshCatalogClasses(log, _id.year, _id.semester);
  }
};

export default { updateCourseDetails };
