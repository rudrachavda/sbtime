import { GradeDistributionModel, SectionModel } from "@repo/common/models";

import { updateCatalogGradeSummaries } from "../lib/catalog-denormalize";
import {
  GradeCountFields,
  Lecture,
  NEXUS_GRADES_URL,
  addGradeCounts,
  matchGradeRow,
  nexusCourseId,
  nexusTermId,
  parseNexusCsv,
  toGradeCounts,
  toGradeDistribution,
} from "../lib/nexus-grades";
import { Config } from "../shared/config";
import { rebuildCourseGradeSummaries } from "./grade-distributions";

/**
 * Load UCSB grade distributions from the Daily Nexus dataset and attach each
 * row to its lecture. Every quarter the catalog has classes for is replaced,
 * so re-running after a new Nexus release picks up the new data.
 */
const importNexusGrades = async (config: Config) => {
  const { log } = config;

  log.info("Downloading the Daily Nexus grades dataset...");
  const response = await fetch(NEXUS_GRADES_URL);
  if (!response.ok) {
    throw new Error(`Could not download grades (HTTP ${response.status}).`);
  }
  const rows = parseNexusCsv(await response.text());
  log.info(`Read ${rows.length.toLocaleString()} grade rows.`);

  const byTerm = new Map<string, typeof rows>();
  for (const row of rows) {
    const termId = nexusTermId(row.quarter, row.year);
    if (termId) byTerm.set(termId, [...(byTerm.get(termId) ?? []), row]);
  }

  const catalogTerms = new Set(await SectionModel.distinct("termId"));
  const totals = {
    quarters: 0,
    rows: 0,
    matched: 0,
    noCourse: 0,
    ambiguous: 0,
    outside: 0,
  };

  for (const [termId, termRows] of [...byTerm].sort(([a], [b]) =>
    a.localeCompare(b)
  )) {
    if (!catalogTerms.has(termId)) {
      totals.outside += termRows.length;
      continue;
    }

    const lectures = (await SectionModel.find(
      { termId, primary: true },
      {
        sectionId: 1,
        number: 1,
        courseId: 1,
        subject: 1,
        courseNumber: 1,
        meetings: 1,
      }
    ).lean()) as Lecture[];

    const byCourse = new Map<string, Lecture[]>();
    for (const lecture of lectures) {
      byCourse.set(lecture.courseId, [
        ...(byCourse.get(lecture.courseId) ?? []),
        lecture,
      ]);
    }

    const bySection = new Map<
      string,
      { lecture: Lecture; counts: GradeCountFields }
    >();
    for (const row of termRows) {
      totals.rows++;
      const courseId = nexusCourseId(row.course);
      const courseLectures = courseId ? byCourse.get(courseId) : undefined;
      if (!courseLectures) {
        totals.noCourse++;
        continue;
      }

      const lecture = matchGradeRow(row, courseLectures);
      if (!lecture) {
        totals.ambiguous++;
        continue;
      }

      const counts = toGradeCounts(row);
      const existing = bySection.get(lecture.sectionId);
      bySection.set(lecture.sectionId, {
        lecture,
        counts: existing ? addGradeCounts(existing.counts, counts) : counts,
      });
      totals.matched++;
    }

    const records = [...bySection.values()].map(({ lecture, counts }) =>
      toGradeDistribution(termId, lecture, counts)
    );

    await GradeDistributionModel.deleteMany({ termId });
    if (records.length > 0) {
      await GradeDistributionModel.insertMany(records, { ordered: false });
    }
    totals.quarters++;
  }

  log.info(
    `Grades for ${totals.quarters} quarters: ${totals.matched.toLocaleString()} of ${totals.rows.toLocaleString()} rows attached to a lecture; ${totals.noCourse.toLocaleString()} for courses not in the catalog, ${totals.ambiguous.toLocaleString()} skipped because the lecture could not be told apart. ${totals.outside.toLocaleString()} rows are from quarters the catalog does not cover.`
  );

  // Course "all time" averages, then the catalog cards that show them.
  await rebuildCourseGradeSummaries(log);
  await updateCatalogGradeSummaries(log);
};

export default { importNexusGrades };
