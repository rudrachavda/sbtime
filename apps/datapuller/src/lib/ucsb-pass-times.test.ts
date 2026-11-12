import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildPassTimeframes } from "./ucsb-pass-times";

describe("buildPassTimeframes", () => {
  it("builds three passes in campus time", () => {
    const timeframes = buildPassTimeframes({
      id: "20264",
      pass1Begin: "2026-05-11T09:00:00",
      pass2Begin: "2026-05-18T09:00:00",
      pass3Begin: "2026-09-08T09:00:00",
      lastDayToAddUndergrad: "2026-10-14",
    });

    assert.equal(timeframes.length, 3);
    assert.deepEqual(
      timeframes.map((t) => [t.phase, t.year, t.semester, t.group]),
      [
        [1, 2026, "Fall", "all"],
        [2, 2026, "Fall", "all"],
        [3, 2026, "Fall", "all"],
      ]
    );
    // 9:00 Pacific Daylight Time is 16:00 UTC.
    assert.equal(timeframes[0].startDate.toISOString(), "2026-05-11T16:00:00.000Z");
    assert.equal(timeframes[0].endDate?.toISOString(), "2026-05-18T16:00:00.000Z");
    assert.equal(timeframes[2].endDate?.toISOString(), "2026-10-14T07:00:00.000Z");
  });

  it("uses standard time in winter", () => {
    const [pass1] = buildPassTimeframes({
      id: "20272",
      pass1Begin: "2027-02-08T09:00:00",
    });
    assert.equal(pass1.startDate.toISOString(), "2027-02-08T17:00:00.000Z");
    assert.equal(pass1.semester, "Spring");
    assert.equal(pass1.endDate, undefined);
  });

  it("skips missing passes and bad codes", () => {
    assert.deepEqual(buildPassTimeframes({ id: "bad", pass1Begin: "2026-01-01" }), []);
    const timeframes = buildPassTimeframes({
      id: "20263",
      pass1Begin: null,
      pass2Begin: "2026-04-20T09:00:00",
    });
    assert.deepEqual(timeframes.map((t) => t.phase), [2]);
  });
});
