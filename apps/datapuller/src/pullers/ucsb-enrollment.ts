import { TermModel } from "@repo/common/models";
import { UcsbClient } from "@repo/ucsb-api";

import { updateCatalogEnrollment } from "../lib/catalog-denormalize";
import { mapQuarter } from "../lib/ucsb-catalog";
import { recordEnrollment } from "../lib/ucsb-enrollment-store";
import { Config } from "../shared/config";
import { fetchQuarter, toCatalogTerm } from "./catalog";
import { checkEnrollmentDrop } from "./enrollment";

/**
 * Record seat counts for the current and upcoming quarters. Meant to run every
 * 15 minutes; it only touches seat counts. The full catalog (titles, times,
 * rooms) is refreshed less often by "catalog-active".
 */
const updateEnrollment = async (config: Config) => {
  const { log } = config;

  const terms = await TermModel.find({
    temporalPosition: { $in: ["Current", "Future"] },
    hasCatalogData: true,
  })
    .select({ id: 1, beginDate: 1, endDate: 1 })
    .sort({ id: 1 })
    .lean();

  if (terms.length === 0) {
    log.info(
      'No current quarters with classes yet. Run "catalog-active" first.'
    );
    return;
  }

  const client = new UcsbClient({ apiKey: config.ucsb.API_KEY });
  const now = new Date();

  for (const term of terms) {
    const catalogTerm = toCatalogTerm(term);
    if (!catalogTerm) continue;

    const label = `${catalogTerm.year} ${catalogTerm.semester}`;

    try {
      const ucsbClasses = await fetchQuarter(config, client, term.id);
      if (!ucsbClasses || ucsbClasses.length === 0) {
        log.info(`UCSB has no classes for ${label}; skipping.`);
        continue;
      }

      const { enrollments } = mapQuarter(
        ucsbClasses,
        catalogTerm,
        new Map(),
        now
      );
      const counts = await recordEnrollment(enrollments);

      // Keep the catalog's "% enrolled" and open-seat numbers current.
      await updateCatalogEnrollment(
        log,
        catalogTerm.year,
        catalogTerm.semester,
        new Map(
          enrollments.map(({ sectionId, snapshot }) => [
            sectionId,
            {
              status: snapshot.status,
              enrolledCount: snapshot.enrolledCount,
              maxEnroll: snapshot.maxEnroll,
              waitlistedCount: snapshot.waitlistedCount,
              maxWaitlist: snapshot.maxWaitlist,
            },
          ])
        )
      );

      log.info(
        `${label}: ${enrollments.length.toLocaleString()} sections (${counts.appended} changed, ${counts.extended} unchanged, ${counts.inserted} new).`
      );
    } catch (error) {
      log.error(
        `Failed to update enrollment for ${label}: ${(error as Error).message}`
      );
    }
  }

  // Email students tracking a class when seats open up (needs SMTP settings;
  // skipped with a warning otherwise).
  await checkEnrollmentDrop(config);
};

export default { updateEnrollment };
