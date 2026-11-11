import type { AnyBulkWriteOperation } from "mongoose";

import {
  IEnrollmentHistoryItem,
  NewEnrollmentHistoryModel,
} from "@repo/common/models";

import { EnrollmentSnapshot } from "./ucsb-catalog";
import { EnrollmentEntry, planEnrollmentWrite } from "./ucsb-enrollment";

const WRITE_BATCH_SIZE = 2000;

export interface EnrollmentWriteCounts {
  inserted: number;
  extended: number;
  appended: number;
}

/**
 * Record a seat-count snapshot for each section: stretch the latest entry if
 * nothing changed, otherwise start a new one.
 */
export const recordEnrollment = async (
  snapshots: EnrollmentSnapshot[]
): Promise<EnrollmentWriteCounts> => {
  const counts: EnrollmentWriteCounts = {
    inserted: 0,
    extended: 0,
    appended: 0,
  };
  if (snapshots.length === 0) return counts;

  const byTerm = new Map<string, EnrollmentSnapshot[]>();
  for (const snapshot of snapshots) {
    byTerm.set(snapshot.termId, [
      ...(byTerm.get(snapshot.termId) ?? []),
      snapshot,
    ]);
  }

  for (const [termId, termSnapshots] of byTerm) {
    // Only each section's latest entry is needed to decide.
    const existing = await NewEnrollmentHistoryModel.find(
      {
        termId,
        sectionId: { $in: termSnapshots.map((snapshot) => snapshot.sectionId) },
      },
      { sessionId: 1, sectionId: 1, history: { $slice: -1 } }
    ).lean();

    const latest = new Map(
      existing.map((doc) => [
        `${doc.sessionId}:${doc.sectionId}`,
        { _id: doc._id, last: doc.history?.[0] as EnrollmentEntry | undefined },
      ])
    );

    const operations: AnyBulkWriteOperation<IEnrollmentHistoryItem>[] = [];

    for (const { snapshot, ...identity } of termSnapshots) {
      const found = latest.get(`${identity.sessionId}:${identity.sectionId}`);

      if (!found) {
        operations.push({
          insertOne: { document: { ...identity, history: [snapshot] } },
        });
        counts.inserted++;
        continue;
      }

      if (
        found.last &&
        planEnrollmentWrite(found.last, snapshot) === "extend"
      ) {
        operations.push({
          updateOne: {
            filter: { _id: found._id },
            update: { $set: { "history.$[last].endTime": snapshot.endTime } },
            // The latest entry is the only one with this start and end time.
            arrayFilters: [
              {
                "last.startTime": found.last.startTime,
                "last.endTime": found.last.endTime,
              },
            ],
          },
        });
        counts.extended++;
      } else {
        operations.push({
          updateOne: {
            filter: { _id: found._id },
            update: { $push: { history: snapshot } },
          },
        });
        counts.appended++;
      }
    }

    for (let i = 0; i < operations.length; i += WRITE_BATCH_SIZE) {
      await NewEnrollmentHistoryModel.bulkWrite(
        operations.slice(i, i + WRITE_BATCH_SIZE),
        { ordered: false }
      );
    }
  }

  return counts;
};
