import { DateTime } from "luxon";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import {
  EnrollmentChart,
  chartToEntries,
  matchChartToSection,
  parseChartDate,
  parsePastEnrollmentPage,
  pastEnrollmentUrl,
  quarterLabelToTermId,
  ucsbplatClassCode,
} from "./ucsbplat-enrollment";

// MATH 3A's past enrollment page (page 1 of 3), as UCSBPlat served it.
const PAGE = readFileSync(
  new URL("./fixtures/ucsbplat-past-enrollment-math-3a.html", import.meta.url),
  "utf8"
);

const pacific = (iso: string) =>
  DateTime.fromISO(iso, { zone: "America/Los_Angeles" });

describe("ucsbplatClassCode", () => {
  it("uses the first discussion section's code when there is one", () => {
    assert.equal(
      ucsbplatClassCode([
        { number: "0102", sectionId: "29165" },
        { number: "0100", sectionId: "29140", primary: true },
        { number: "0101", sectionId: "29157" },
      ]),
      "29157"
    );
  });

  it("uses the lecture's code when there are no discussions", () => {
    assert.equal(
      ucsbplatClassCode([
        { number: "0100", sectionId: "36608", primary: true },
      ]),
      "36608"
    );
  });
});

describe("pastEnrollmentUrl", () => {
  it("builds the page address, with a page number after the first", () => {
    assert.equal(
      pastEnrollmentUrl(2027, "Winter", "29157"),
      "https://ucsbplat.com/curriculum/past_enrollment_trends/WINTER%202027%2029157"
    );
    assert.equal(
      pastEnrollmentUrl(2027, "Winter", "29157", 3),
      "https://ucsbplat.com/curriculum/past_enrollment_trends/WINTER%202027%2029157?page=3"
    );
  });
});

describe("parsePastEnrollmentPage", () => {
  const { charts, lastPage } = parsePastEnrollmentPage(PAGE);

  it("finds every chart and the page count", () => {
    assert.equal(charts.length, 6);
    assert.equal(lastPage, 3);
  });

  it("reads each chart's header", () => {
    const [first] = charts;
    assert.equal(first.quarter, "Winter 2024");
    assert.equal(first.instructor, "Kumar S L");
    assert.equal(first.location, "LSB 1001");
    assert.deepEqual(first.days, [
      false,
      true,
      false,
      true,
      false,
      false,
      false,
    ]);
    assert.equal(first.startTime, "15:30");
  });

  it("reads matching date, enrolled and capacity series", () => {
    for (const chart of charts) {
      assert.ok(chart.labels.length > 0);
      assert.equal(chart.enrolled.length, chart.labels.length);
      assert.equal(chart.capacity.length, chart.labels.length);
    }
  });

  it("returns nothing for a page without charts", () => {
    assert.deepEqual(parsePastEnrollmentPage("<html>404</html>"), {
      charts: [],
      lastPage: 1,
    });
  });
});

describe("quarterLabelToTermId", () => {
  it("maps quarter names to UCSB quarter codes", () => {
    assert.equal(quarterLabelToTermId("Winter 2024"), "20241");
    assert.equal(quarterLabelToTermId("Fall 2026"), "20264");
    assert.equal(quarterLabelToTermId("Summer 2025"), "20253");
    assert.equal(quarterLabelToTermId("Someday"), null);
  });
});

describe("parseChartDate", () => {
  const fall2026 = pacific("2026-09-24");

  it("reads dates with a year", () => {
    assert.equal(
      parseChartDate("Jan 29 2024", fall2026)?.toISODate(),
      "2024-01-29"
    );
  });

  it("gives dates without a year the one nearest the quarter", () => {
    assert.equal(parseChartDate("Sep 22", fall2026)?.toISODate(), "2026-09-22");
    // Winter enrollment starts the November before.
    assert.equal(
      parseChartDate("Nov 14", pacific("2027-01-04"))?.toISODate(),
      "2026-11-14"
    );
  });

  it("rejects text that is not a date", () => {
    assert.equal(parseChartDate("soon", fall2026), null);
  });
});

describe("chartToEntries", () => {
  const chart: EnrollmentChart = {
    quarter: "Spring 2024",
    days: Array(7).fill(false),
    labels: [
      "Feb 13 2024",
      "Feb 14 2024",
      "Feb 15 2024",
      "Feb 16 2024",
      "Feb 20 2024",
    ],
    enrolled: [0, 2, 2, 2, 2],
    capacity: [20, 20, 20, 20, 20],
  };
  const entries = chartToEntries(chart, pacific("2024-04-01"));

  it("merges consecutive days with the same numbers", () => {
    assert.deepEqual(
      entries.map((e) => [
        DateTime.fromJSDate(e.startTime)
          .setZone("America/Los_Angeles")
          .toISODate(),
        DateTime.fromJSDate(e.endTime)
          .setZone("America/Los_Angeles")
          .toISODate(),
        e.enrolledCount,
      ]),
      [
        ["2024-02-13", "2024-02-13", 0],
        ["2024-02-14", "2024-02-16", 2],
        // A gap in the data starts a new entry.
        ["2024-02-20", "2024-02-20", 2],
      ]
    );
  });

  it("marks entries as daily, open or closed, and from UCSBPlat", () => {
    assert.ok(
      entries.every(
        (e) => e.granularitySeconds === 86400 && e.source === "ucsbplat"
      )
    );
    const full = chartToEntries(
      { ...chart, labels: ["Mar 01 2024"], enrolled: [20], capacity: [20] },
      pacific("2024-04-01")
    );
    assert.equal(full[0].status, "C");
    assert.equal(entries[0].status, "O");
  });
});

describe("matchChartToSection", () => {
  const chart = parsePastEnrollmentPage(PAGE).charts[0];
  const lecture = (
    sectionId: string,
    days: boolean[],
    startTime: string,
    location: string,
    familyName: string
  ) => ({
    sectionId,
    meetings: [
      {
        days,
        startTime,
        location,
        instructors: [{ familyName, givenName: "X" }],
      },
    ],
  });
  const TR = [false, true, false, true, false, false, false];
  const MWF = [true, false, true, false, true, false, false];

  it("takes the only lecture of the quarter", () => {
    assert.equal(
      matchChartToSection(chart, [lecture("1", MWF, "08:00:00", "X 1", "Y")]),
      "1"
    );
  });

  it("picks the lecture whose days, time and room agree", () => {
    assert.equal(
      matchChartToSection(chart, [
        lecture("1", TR, "08:00:00", "HSSB 1173", "ZHOU"),
        lecture("2", TR, "15:30:00", "LSB 1001", "KUMAR"),
      ]),
      "2"
    );
  });

  it("refuses to guess between equally good matches", () => {
    assert.equal(
      matchChartToSection(chart, [
        lecture("1", TR, "15:30:00", "LSB 1001", "KUMAR"),
        lecture("2", TR, "15:30:00", "LSB 1001", "KUMAR"),
      ]),
      null
    );
    assert.equal(
      matchChartToSection(chart, [
        lecture("1", MWF, "09:00:00", "HSSB 1173", "ZHOU"),
        lecture("2", MWF, "12:00:00", "PHELP 1445", "YAN"),
      ]),
      null
    );
  });
});
