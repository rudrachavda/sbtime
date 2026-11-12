import { EnrollmentTimeframeModel, TermModel } from "@repo/common/models";

import { getAllTerms, getNearbyTerms } from "../lib/terms";
import { buildPassTimeframes } from "../lib/ucsb-pass-times";
import { Config } from "../shared/config";

const updateTerms = async (config: Config, allTerms: boolean) => {
  const {
    log,
    ucsb: { API_KEY },
  } = config;

  log.trace(`Fetching terms...`);

  const terms = allTerms
    ? await getAllTerms(log, API_KEY)
    : await getNearbyTerms(log, API_KEY);

  log.info(`Fetched ${terms.length.toLocaleString()} terms.`);
  if (terms.length === 0) {
    log.info("No terms found.");
    return;
  }
  // Update terms in batches of 5000. hasCatalogData is derived from class
  // data, so a calendar refresh must not overwrite it for existing terms.
  // New terms remain hidden until the classes puller confirms catalog data.
  const insertBatchSize = 5000;
  for (let i = 0; i < terms.length; i += insertBatchSize) {
    const batch = terms.slice(i, i + insertBatchSize);

    log.trace(`Updating batch ${i / insertBatchSize + 1}...`);

    await TermModel.bulkWrite(
      batch.map((term) => {
        const sisTermFields: Partial<typeof term> = { ...term };
        delete sisTermFields.hasCatalogData;

        return {
          updateOne: {
            filter: {
              id: term.id,
              academicCareerCode: term.academicCareerCode,
            },
            update: {
              $set: sisTermFields,
              $setOnInsert: { hasCatalogData: false },
            },
            upsert: true,
          },
        };
      })
    );
  }

  log.info(
    `Completed updating database with ${terms.length.toLocaleString()} terms.`
  );

  // Registration passes become the Enrollment graph's phase markers.
  const timeframes = terms
    .filter((term) => term.academicCareerCode === "UGRD")
    .flatMap((term) => buildPassTimeframes(term));
  if (timeframes.length > 0) {
    await EnrollmentTimeframeModel.bulkWrite(
      timeframes.map((timeframe) => ({
        updateOne: {
          filter: {
            termId: timeframe.termId,
            phase: timeframe.phase,
            isAdjustment: timeframe.isAdjustment,
            group: timeframe.group,
          },
          update: {
            $set: { ...timeframe, lastSyncedAt: new Date() },
            ...(timeframe.endDate ? {} : { $unset: { endDate: "" } }),
          },
          upsert: true,
        },
      }))
    );
    log.info(
      `Updated ${timeframes.length.toLocaleString()} registration pass times.`
    );
  }
};

const allTerms = async (config: Config) => {
  return updateTerms(config, true);
};

const nearbyTerms = async (config: Config) => {
  return updateTerms(config, false);
};

export default {
  allTerms,
  nearbyTerms,
};
