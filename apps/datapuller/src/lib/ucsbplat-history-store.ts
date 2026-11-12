import {
  IEnrollmentHistoryItem,
  NewEnrollmentHistoryModel,
} from "@repo/common/models";

import { EnrollmentEntry } from "./ucsb-enrollment";
import { ENROLLMENT_SOURCE, TimeRange } from "./ucsbplat-enrollment";

type SectionKey = Pick<
  IEnrollmentHistoryItem,
  "termId" | "sessionId" | "sectionId"
>;

/**
 * The stretches of time SBTime recorded a section itself (every entry not
 * imported from UCSBPlat), so imports can skip those days.
 */
export const recordedRanges = async (key: SectionKey): Promise<TimeRange[]> => {
  const doc = await NewEnrollmentHistoryModel.findOne(key, {
    history: 1,
  }).lean();
  return (doc?.history ?? [])
    .filter((entry) => entry.source !== ENROLLMENT_SOURCE)
    .map((entry) => ({
      start: new Date(entry.startTime),
      end: new Date(entry.endTime),
    }));
};

/**
 * Store imported history for one section: earlier imports from UCSBPlat are
 * replaced, SBTime's own entries are kept, oldest first.
 */
export const saveImportedHistory = async (
  identity: Omit<IEnrollmentHistoryItem, "history">,
  imported: EnrollmentEntry[]
) => {
  const key = {
    termId: identity.termId,
    sessionId: identity.sessionId,
    sectionId: identity.sectionId,
  };
  const existing = await NewEnrollmentHistoryModel.findOne(key, {
    history: 1,
  }).lean();

  const history = [
    ...(existing?.history ?? []).filter(
      (entry) => entry.source !== ENROLLMENT_SOURCE
    ),
    ...imported,
  ].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  await NewEnrollmentHistoryModel.updateOne(
    key,
    { $set: { ...identity, history } },
    { upsert: true }
  );
};
