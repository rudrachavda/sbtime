import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ENROLLMENT_DATA_GAP_SECONDS,
  ENROLLMENT_GRANULARITY_SECONDS,
  EnrollmentEntry,
  planEnrollmentWrite,
} from "./ucsb-enrollment";

const at = (iso: string) => new Date(iso);

const entry = (
  startTime: string,
  endTime: string,
  overrides: Partial<EnrollmentEntry> = {}
): EnrollmentEntry => ({
  startTime: at(startTime),
  endTime: at(endTime),
  granularitySeconds: ENROLLMENT_GRANULARITY_SECONDS,
  status: "O",
  enrolledCount: 361,
  maxEnroll: 400,
  waitlistedCount: 0,
  maxWaitlist: 0,
  ...overrides,
});

const LAST = entry("2026-11-10T08:00:00Z", "2026-11-10T09:00:00Z");

describe("planEnrollmentWrite", () => {
  it("starts the history when there is no entry yet", () => {
    assert.equal(
      planEnrollmentWrite(
        undefined,
        entry("2026-11-10T09:15:00Z", "2026-11-10T09:15:00Z")
      ),
      "append"
    );
  });

  it("extends the latest entry when nothing changed", () => {
    const next = entry("2026-11-10T09:15:00Z", "2026-11-10T09:15:00Z");
    assert.equal(planEnrollmentWrite(LAST, next), "extend");
  });

  it("starts a new entry when the numbers change", () => {
    assert.equal(
      planEnrollmentWrite(
        LAST,
        entry("2026-11-10T09:15:00Z", "2026-11-10T09:15:00Z", {
          enrolledCount: 362,
        })
      ),
      "append"
    );
    assert.equal(
      planEnrollmentWrite(
        LAST,
        entry("2026-11-10T09:15:00Z", "2026-11-10T09:15:00Z", { status: "C" })
      ),
      "append"
    );
    assert.equal(
      planEnrollmentWrite(
        LAST,
        entry("2026-11-10T09:15:00Z", "2026-11-10T09:15:00Z", {
          maxEnroll: 420,
        })
      ),
      "append"
    );
  });

  it("starts a new entry after a long gap between pulls", () => {
    const gapEnd = new Date(
      LAST.endTime.getTime() + (ENROLLMENT_DATA_GAP_SECONDS + 60) * 1000
    );
    const late = entry(gapEnd.toISOString(), gapEnd.toISOString());
    assert.equal(planEnrollmentWrite(LAST, late), "append");

    const justInTime = new Date(
      LAST.endTime.getTime() + ENROLLMENT_DATA_GAP_SECONDS * 1000
    );
    assert.equal(
      planEnrollmentWrite(
        LAST,
        entry(justInTime.toISOString(), justInTime.toISOString())
      ),
      "extend"
    );
  });

  it("starts a new entry when the granularity differs", () => {
    assert.equal(
      planEnrollmentWrite(
        LAST,
        entry("2026-11-10T09:15:00Z", "2026-11-10T09:15:00Z", {
          granularitySeconds: 0,
        })
      ),
      "append"
    );
  });

  it("never extends backwards in time", () => {
    assert.equal(
      planEnrollmentWrite(
        LAST,
        entry("2026-11-10T08:30:00Z", "2026-11-10T08:30:00Z")
      ),
      "append"
    );
  });
});
