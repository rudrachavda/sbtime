import { parseArgs } from "node:util";

import { updateCatalogGradeSummaries } from "./lib/catalog-denormalize";
import catalogPuller from "./pullers/catalog";
import catalogDetailsPuller from "./pullers/catalog-details";
import classesPuller from "./pullers/classes";
import coursesPuller from "./pullers/courses";
import decalsPuller from "./pullers/decals";
import enrollmentHistoriesPuller from "./pullers/enrollment";
import enrollmentTimeframePuller from "./pullers/enrollment-timeframe";
import gradeDistributionsPuller from "./pullers/grade-distributions";
import migrationsPuller from "./pullers/migrations";
import nexusGradesPuller from "./pullers/nexus-grades";
import sectionsPuller from "./pullers/sections";
import termsPuller from "./pullers/terms";
import ucsbEnrollmentPuller from "./pullers/ucsb-enrollment";
import ucsbFinalsPuller from "./pullers/ucsb-finals";
import ucsbplatEnrollmentHistoryPuller from "./pullers/ucsbplat-enrollment-history";
import setup from "./shared";
import { Config } from "./shared/config";

const cliArgs = {
  puller: {
    type: "string" as const,
  },
} as const;

const pullerMap: {
  [key: string]: (config: Config, ...arg: any) => Promise<unknown>;
} = {
  // UCSB: courses, classes, sections and seat counts for whole quarters.
  "catalog-active": catalogPuller.activeTerms,
  "catalog-backfill": catalogPuller.backfillTerms,
  // UCSB: seat counts for current and upcoming quarters (every 15 minutes).
  "enrollment-active": ucsbEnrollmentPuller.updateEnrollment,
  // UCSB: final exam times for current and upcoming quarters.
  "finals-active": ucsbFinalsPuller.updateFinals,
  // UCSBPlat: daily seat-count history recorded before SBTime (since 2024).
  "enrollment-history-ucsbplat":
    ucsbplatEnrollmentHistoryPuller.importEnrollmentHistory,
  // UCSB: prerequisites and full titles from the public General Catalog.
  "catalog-details": catalogDetailsPuller.updateCourseDetails,
  // Daily Nexus: grade distributions (public records data).
  "grades-nexus": nexusGradesPuller.importNexusGrades,
  courses: coursesPuller.updateCourses,
  decals: decalsPuller.scrapeDeCals,
  "sections-active": sectionsPuller.activeTerms,
  "sections-last-five-years": sectionsPuller.lastFiveYearsTerms,
  "classes-active": classesPuller.activeTerms,
  "classes-last-five-years": classesPuller.lastFiveYearsTerms,
  "grades-recent": gradeDistributionsPuller.recentPastTerms,
  "grades-last-five-years": gradeDistributionsPuller.lastFiveYearsTerms,
  enrollments: enrollmentHistoriesPuller.updateEnrollmentHistories,
  "enrollment-timeframe": enrollmentTimeframePuller.syncEnrollmentTimeframe,
  "terms-all": termsPuller.allTerms,
  "terms-nearby": termsPuller.nearbyTerms,
  "migrate-aggregated-metrics-classid":
    migrationsPuller.backfillAggregatedMetricsClassId,
  "catalog-sync-grades": async (config: Config) =>
    updateCatalogGradeSummaries(config.log),
} as const;

const runPuller = async () => {
  const { values: args } = parseArgs({ options: cliArgs });

  if (!args.puller || !pullerMap[args.puller]) {
    throw new Error(
      "Please specify a valid puller argument: " +
        Object.keys(pullerMap).join(", ")
    );
  }

  const { config } = await setup();
  const logger = config.log.getSubLogger({ name: "PullerRunner" });
  try {
    logger.info(
      `Starting ${args.puller} puller with args: ${JSON.stringify(args)}`
    );

    await pullerMap[args.puller](config);

    logger.trace(`${args.puller} puller completed successfully`);
    process.exit(0);
  } catch (error: any) {
    logger.error(`${args.puller} puller failed: ${error.message}`);
    process.exit(1);
  }
};

runPuller();
