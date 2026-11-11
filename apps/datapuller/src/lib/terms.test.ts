import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { UcsbQuarter } from "@repo/ucsb-api";

import {
  formatQuarter,
  parseQuarterCode,
  selectTerms,
  shiftQuarterCode,
} from "./terms";

// Fall 2026 exactly as UCSB's quarter calendar returned it.
const FALL_2026: UcsbQuarter = {
  quarter: "20264",
  qyy: "F26",
  name: "FALL 2026",
  category: "FALL",
  academicYear: "2026-2027",
  firstDayOfClasses: "2026-09-24T00:00:00",
  lastDayOfClasses: "2026-12-04T00:00:00",
  firstDayOfFinals: "2026-12-05T00:00:00",
  lastDayOfFinals: "2026-12-11T00:00:00",
  firstDayOfQuarter: "2026-09-20T00:00:00",
  lastDayOfSchedule: "2027-01-03T00:00:00",
  pass1Begin: "2026-05-11T09:00:00",
  pass2Begin: "2026-05-18T09:00:00",
  pass3Begin: "2026-09-08T09:00:00",
  feeDeadline: "2026-09-15T00:00:00",
  lastDayToAddUnderGrad: "2026-10-14T00:00:00",
  lastDayToAddGrad: "2026-12-04T00:00:00",
  lastDayThirdWeek: "2026-10-15T00:00:00",
};

const quarter = (code: string, overrides: Partial<UcsbQuarter> = {}) => ({
  ...FALL_2026,
  quarter: code,
  ...overrides,
});

describe("parseQuarterCode", () => {
  it("maps the last digit to a season", () => {
    assert.deepEqual(parseQuarterCode("20261"), {
      year: 2026,
      season: "Winter",
    });
    assert.deepEqual(parseQuarterCode("20262"), {
      year: 2026,
      season: "Spring",
    });
    assert.deepEqual(parseQuarterCode("20263"), {
      year: 2026,
      season: "Summer",
    });
    assert.deepEqual(parseQuarterCode("20264"), { year: 2026, season: "Fall" });
  });

  it("tolerates padding and rejects malformed codes", () => {
    assert.deepEqual(parseQuarterCode(" 20264 "), {
      year: 2026,
      season: "Fall",
    });
    assert.equal(parseQuarterCode("20265"), null);
    assert.equal(parseQuarterCode("2026"), null);
    assert.equal(parseQuarterCode("F26"), null);
  });
});

describe("shiftQuarterCode", () => {
  it("moves within a year", () => {
    assert.equal(shiftQuarterCode("20261", 1), "20262");
    assert.equal(shiftQuarterCode("20264", -1), "20263");
  });

  it("rolls over year boundaries in both directions", () => {
    assert.equal(shiftQuarterCode("20264", 1), "20271");
    assert.equal(shiftQuarterCode("20264", 2), "20272");
    assert.equal(shiftQuarterCode("20261", -1), "20254");
    assert.equal(shiftQuarterCode("20264", 0), "20264");
  });

  it("throws on an invalid code", () => {
    assert.throws(() => shiftQuarterCode("nope", 1));
  });
});

describe("formatQuarter", () => {
  it("converts a quarter into the stored term shape", () => {
    const term = formatQuarter(FALL_2026, "20264");

    assert.ok(term);
    assert.equal(term.id, "20264");
    assert.equal(term.name, "2026 Fall");
    assert.equal(term.academicCareerCode, "UGRD");
    assert.equal(term.academicYear, "2026-2027");
    assert.equal(term.temporalPosition, "Current");
    assert.equal(term.beginDate, "2026-09-24");
    assert.equal(term.endDate, "2026-12-11");
    assert.equal(term.hasCatalogData, false);
    assert.equal(term.selfServiceEnrollBeginDate, "2026-05-11");
    assert.equal(term.firstDayOfFinals, "2026-12-05");
    assert.equal(term.lastDayToAddUndergrad, "2026-10-14");
  });

  it("keeps the time of day on registration passes", () => {
    const term = formatQuarter(FALL_2026, "20264");

    assert.equal(term?.pass1Begin, "2026-05-11T09:00:00");
    assert.equal(term?.pass3Begin, "2026-09-08T09:00:00");
  });

  it("gives every quarter one regular session spanning the term", () => {
    const term = formatQuarter(FALL_2026, "20264");

    assert.deepEqual(term?.sessions, [
      {
        temporalPosition: "Current",
        id: "1",
        name: "Regular Academic Session",
        beginDate: "2026-09-24",
        endDate: "2026-12-11",
      },
    ]);
  });

  it("places quarters relative to the current one", () => {
    assert.equal(
      formatQuarter(quarter("20263"), "20264")?.temporalPosition,
      "Past"
    );
    assert.equal(
      formatQuarter(quarter("20154"), "20264")?.temporalPosition,
      "Past"
    );
    assert.equal(
      formatQuarter(quarter("20271"), "20264")?.temporalPosition,
      "Future"
    );
  });

  it("falls back to the last day of classes when finals are missing", () => {
    const term = formatQuarter(
      quarter("20264", { lastDayOfFinals: null }),
      "20264"
    );

    assert.equal(term?.endDate, "2026-12-04");
  });

  it("skips quarters without usable dates or codes", () => {
    assert.equal(
      formatQuarter(quarter("20264", { firstDayOfClasses: null }), "20264"),
      null
    );
    assert.equal(
      formatQuarter(
        quarter("20264", { lastDayOfFinals: null, lastDayOfClasses: null }),
        "20264"
      ),
      null
    );
    assert.equal(formatQuarter(quarter("bad"), "20264"), null);
  });

  it("leaves optional dates undefined when UCSB sends null", () => {
    const term = formatQuarter(
      quarter("20264", { pass1Begin: null, feeDeadline: null }),
      "20264"
    );

    assert.equal(term?.pass1Begin, undefined);
    assert.equal(term?.selfServiceEnrollBeginDate, undefined);
    assert.equal(term?.feeDeadline, undefined);
  });
});

describe("selectTerms", () => {
  const quarters = [
    quarter("20271"),
    quarter("20154"),
    quarter("20264"),
    quarter("20153"),
    quarter("20273"),
    quarter("20263", { firstDayOfClasses: null }),
  ];

  it("keeps only quarters in range, oldest first", () => {
    const { terms } = selectTerms(quarters, "20264", "20154", "20272");

    assert.deepEqual(
      terms.map((term) => term.id),
      ["20154", "20264", "20271"]
    );
  });

  it("reports quarters it had to skip", () => {
    const { skipped } = selectTerms(quarters, "20264", "20154", "20272");

    assert.deepEqual(skipped, ["20263"]);
  });

  it("marks exactly one term as current", () => {
    const { terms } = selectTerms(quarters, "20264", "20154", "20272");

    assert.equal(
      terms.filter((term) => term.temporalPosition === "Current").length,
      1
    );
  });
});
