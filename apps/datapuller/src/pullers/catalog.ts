import {
  ClassModel,
  CourseCatalogDetailModel,
  CourseModel,
  NewEnrollmentHistoryModel,
  SectionModel,
  TermModel,
} from "@repo/common/models";
import {
  UcsbApiError,
  UcsbClass,
  UcsbClient,
  getDepartments,
  getQuarterClasses,
  getSubjects,
} from "@repo/ucsb-api";

import { refreshCatalogClasses } from "../lib/catalog-denormalize";
import { parseQuarterCode, shiftQuarterCode } from "../lib/terms";
import {
  CatalogNames,
  CatalogTerm,
  CourseDetails,
  EMPTY_NAMES,
  buildCatalogNames,
  mapQuarter,
} from "../lib/ucsb-catalog";
import { Config } from "../shared/config";
import { updateTermsCatalogDataFlags } from "./classes";

const WRITE_BATCH_SIZE = 2000;

/** How far back "catalog-backfill" goes: five years of quarters. */
const BACKFILL_QUARTERS = 20;

const inBatches = async <T>(
  items: T[],
  write: (batch: T[]) => Promise<unknown>
) => {
  for (let i = 0; i < items.length; i += WRITE_BATCH_SIZE) {
    await write(items.slice(i, i + WRITE_BATCH_SIZE));
  }
};

/** Catalog details cached by the "catalog-details" puller, keyed by course id. */
export const loadCourseDetails = async (courseIds?: string[]) => {
  const filter = courseIds
    ? { found: true, courseId: { $in: courseIds } }
    : { found: true };
  const details = await CourseCatalogDetailModel.find(filter).lean();

  return new Map<string, CourseDetails>(
    details.map((detail) => [detail.courseId, detail])
  );
};

/**
 * Subject and department names from the Registrar's lookup tables. The
 * catalog still works without them, showing codes instead of names.
 */
const loadCatalogNames = async (
  config: Config,
  client: UcsbClient
): Promise<CatalogNames> => {
  try {
    const [subjects, departments] = await Promise.all([
      getSubjects(client),
      getDepartments(client),
    ]);
    const names = buildCatalogNames(subjects, departments);
    config.log.info(
      `Loaded ${names.subjects.size} subject and ${names.departments.size} department names.`
    );
    return names;
  } catch (error) {
    config.log.warn(
      `Could not load subject and department names; showing codes instead: ${(error as Error).message}`
    );
    return EMPTY_NAMES;
  }
};

const toCatalogTerm = (term: {
  id: string;
  beginDate: string;
  endDate: string;
}): CatalogTerm | null => {
  const parsed = parseQuarterCode(term.id);
  if (!parsed) return null;

  return {
    id: term.id,
    year: parsed.year,
    semester: parsed.season,
    beginDate: term.beginDate,
    endDate: term.endDate,
  };
};

/**
 * Fetch a quarter's classes. Returns null when UCSB has not published the
 * quarter's schedule yet, which it reports as a 400.
 */
const fetchQuarter = async (
  config: Config,
  client: UcsbClient,
  quarter: string
): Promise<UcsbClass[] | null> => {
  try {
    return await getQuarterClasses(client, quarter, (fetched, total) =>
      config.log.trace(
        `  ${fetched.toLocaleString()} / ${total.toLocaleString()} courses`
      )
    );
  } catch (error) {
    if (error instanceof UcsbApiError && error.status === 400) return null;
    throw error;
  }
};

/**
 * Pull one quarter from UCSB and replace that quarter's classes and sections.
 * Returns false when there is nothing to store for the quarter.
 */
const updateQuarter = async (
  config: Config,
  client: UcsbClient,
  term: CatalogTerm,
  details: Map<string, CourseDetails>,
  names: CatalogNames
) => {
  const { log } = config;
  const label = `${term.year} ${term.semester} (${term.id})`;

  log.trace(`Fetching classes for ${label}...`);

  const ucsbClasses = await fetchQuarter(config, client, term.id);

  if (!ucsbClasses || ucsbClasses.length === 0) {
    log.info(`UCSB has not published ${label} yet; skipping.`);
    return false;
  }

  const mapped = mapQuarter(ucsbClasses, term, details, new Date(), names);

  if (mapped.unknownInstructionTypes.length > 0) {
    log.warn(
      `Unrecognised instruction types in ${label}: ${mapped.unknownInstructionTypes.join(", ")}`
    );
  }

  if (mapped.classes.length === 0) {
    // Never wipe a quarter because of an empty or unparseable response.
    log.warn(`No usable classes mapped for ${label}; leaving it unchanged.`);
    return false;
  }

  // Replace the quarter's classes and sections.
  await ClassModel.deleteMany({ termId: term.id });
  await inBatches(mapped.classes, (batch) =>
    ClassModel.insertMany(batch, { ordered: false })
  );

  await SectionModel.deleteMany({ termId: term.id });
  await inBatches(mapped.sections, (batch) =>
    SectionModel.insertMany(batch, { ordered: false })
  );

  // Courses persist across quarters; the newest quarter pulled wins.
  await inBatches(mapped.courses, (batch) =>
    CourseModel.bulkWrite(
      batch.map((course) => ({
        updateOne: {
          filter: { courseId: course.courseId },
          update: { $set: course },
          upsert: true,
        },
      }))
    )
  );

  // Append a seat-count snapshot per section.
  await inBatches(mapped.enrollments, (batch) =>
    NewEnrollmentHistoryModel.bulkWrite(
      batch.map(({ snapshot, ...identity }) => ({
        updateOne: {
          filter: {
            termId: identity.termId,
            sessionId: identity.sessionId,
            sectionId: identity.sectionId,
          },
          update: { $set: identity, $push: { history: snapshot } },
          upsert: true,
        },
      }))
    )
  );

  log.info(
    `${label}: ${mapped.courses.length.toLocaleString()} courses, ${mapped.classes.length.toLocaleString()} classes, ${mapped.sections.length.toLocaleString()} sections.`
  );

  await refreshCatalogClasses(log, term.year, term.semester);

  return true;
};

const updateCatalog = async (
  config: Config,
  selectTerms: (currentId: string) => Record<string, unknown>
) => {
  const { log } = config;

  const current = await TermModel.findOne({ temporalPosition: "Current" })
    .select({ id: 1 })
    .lean();
  if (!current) {
    throw new Error('No current term found. Run the "terms-all" puller first.');
  }

  const terms = await TermModel.find(selectTerms(current.id))
    .select({ id: 1, beginDate: 1, endDate: 1 })
    .sort({ id: 1 })
    .lean();

  log.info(`Updating catalog for ${terms.length} quarters...`);

  const client = new UcsbClient({ apiKey: config.ucsb.API_KEY });
  const details = await loadCourseDetails();
  const names = await loadCatalogNames(config, client);
  let updated = 0;

  for (const term of terms) {
    const catalogTerm = toCatalogTerm(term);
    if (!catalogTerm) {
      log.warn(`Skipping term with an unexpected id: ${term.id}`);
      continue;
    }

    try {
      if (await updateQuarter(config, client, catalogTerm, details, names)) {
        updated++;
      }
    } catch (error) {
      // One bad quarter should not stop the others.
      log.error(`Failed to update ${term.id}: ${(error as Error).message}`);
    }
  }

  await updateTermsCatalogDataFlags(log);

  log.info(`Updated ${updated} / ${terms.length} quarters.`);
};

/** The current quarter and any future ones UCSB has published. */
const activeTerms = (config: Config) =>
  updateCatalog(config, () => ({
    temporalPosition: { $in: ["Current", "Future"] },
  }));

/** The last five years, through the newest published quarter. */
const backfillTerms = (config: Config) =>
  updateCatalog(config, (currentId) => ({
    id: { $gte: shiftQuarterCode(currentId, -BACKFILL_QUARTERS) },
  }));

export default { activeTerms, backfillTerms };
