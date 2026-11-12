import { ClassModel, SectionModel, TermModel } from "@repo/common/models";
import { UcsbApiError, UcsbClient, getFinalExam } from "@repo/ucsb-api";

import { refreshCatalogClasses } from "../lib/catalog-denormalize";
import { parseQuarterCode } from "../lib/terms";
import { formatFinalExam } from "../lib/ucsb-finals";
import { Config } from "../shared/config";

/** Requests in flight at once. */
const CONCURRENCY = 4;

/**
 * Pull final exam times for every lecture in the current and upcoming
 * quarters (one request per lecture), then rebuild those quarters' catalog.
 */
const updateFinals = async (config: Config) => {
  const { log } = config;
  const client = new UcsbClient({ apiKey: config.ucsb.API_KEY });

  const terms = await TermModel.find({
    temporalPosition: { $in: ["Current", "Future"] },
    hasCatalogData: true,
  })
    .select({ id: 1 })
    .sort({ id: 1 })
    .lean();

  for (const term of terms) {
    const quarter = parseQuarterCode(term.id);
    if (!quarter) continue;
    const label = `${quarter.year} ${quarter.season}`;

    const lectures = await SectionModel.find(
      { termId: term.id, primary: true },
      { sectionId: 1, courseId: 1, classNumber: 1 }
    ).lean();

    log.info(
      `Fetching final exams for ${lectures.length.toLocaleString()} ${label} lectures...`
    );

    const counts = { scheduled: 0, none: 0, unknown: 0, failed: 0 };
    let next = 0;

    const worker = async () => {
      while (next < lectures.length) {
        const lecture = lectures[next++];
        try {
          const result = formatFinalExam(
            await getFinalExam(client, term.id, lecture.sectionId)
          );
          if (!result) {
            counts.unknown++;
            continue;
          }

          await SectionModel.updateOne(
            { termId: term.id, sectionId: lecture.sectionId },
            { $set: { exams: result.exams } }
          );
          await ClassModel.updateOne(
            {
              termId: term.id,
              courseId: lecture.courseId,
              number: lecture.classNumber,
            },
            { $set: { finalExam: result.finalExam } }
          );
          if (result.finalExam === "Y") counts.scheduled++;
          else counts.none++;
        } catch (error) {
          counts.failed++;
          if (!(error instanceof UcsbApiError) || error.status >= 500) {
            log.warn(
              `Final exam lookup failed for ${lecture.courseId} (${lecture.sectionId}): ${(error as Error).message}`
            );
          }
        }
      }
    };

    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    log.info(
      `${label}: ${counts.scheduled.toLocaleString()} with a final, ${counts.none.toLocaleString()} without, ${counts.unknown.toLocaleString()} unknown, ${counts.failed.toLocaleString()} failed.`
    );

    await refreshCatalogClasses(log, quarter.year, quarter.season);
  }
};

export default { updateFinals };
