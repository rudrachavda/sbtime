import { IEnrollmentHistoryItem } from "@repo/common/models";

/**
 * Seat counts are stored as time ranges, the way Berkeleytime does it: while
 * the numbers stay the same the latest entry's end time moves forward, and a
 * change (or a long gap between pulls) starts a new entry.
 */

export type EnrollmentEntry = IEnrollmentHistoryItem["history"][number];

/** How often the enrollment puller is meant to run. */
export const ENROLLMENT_GRANULARITY_SECONDS = 15 * 60;

/** A gap longer than this between pulls starts a new entry. */
export const ENROLLMENT_DATA_GAP_SECONDS = 4 * ENROLLMENT_GRANULARITY_SECONDS;

export const sameEnrollment = (a: EnrollmentEntry, b: EnrollmentEntry) =>
  a.status === b.status &&
  a.enrolledCount === b.enrolledCount &&
  a.maxEnroll === b.maxEnroll &&
  a.waitlistedCount === b.waitlistedCount &&
  a.maxWaitlist === b.maxWaitlist &&
  a.instructorAddConsentRequired === b.instructorAddConsentRequired;

export type EnrollmentWrite = "append" | "extend";

/**
 * Decide how to record an incoming snapshot given the section's latest
 * stored entry.
 */
export const planEnrollmentWrite = (
  last: EnrollmentEntry | undefined,
  incoming: EnrollmentEntry
): EnrollmentWrite => {
  if (!last) return "append";

  const gapSeconds =
    (new Date(incoming.startTime).getTime() -
      new Date(last.endTime).getTime()) /
    1000;

  const continues =
    sameEnrollment(last, incoming) &&
    last.granularitySeconds === incoming.granularitySeconds &&
    gapSeconds >= 0 &&
    gapSeconds <= ENROLLMENT_DATA_GAP_SECONDS;

  return continues ? "extend" : "append";
};
