import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  Lecture,
  addGradeCounts,
  matchGradeRow,
  nexusCourseId,
  nexusTermId,
  parseNexusCsv,
  toGradeCounts,
  toGradeDistribution,
} from "./nexus-grades";

// Header and two rows in the published format.
const CSV = [
  "course,instructor,quarter,year,A,B,C,D,F,nLetterStudents,nPNPStudents,avgGPA,P,dept,S,su,Ap,Bp,Cp,Dp,Am,Bm,Cm,Dm,IP",
  "CMPSC   130A,SURI S,Fall,2024,40,30,10,2,3,120,0,3.1,0,CMPSC,0,0.0,5,12,6,1,15,9,4,1,0",
  "WRIT    500,BROWNING R,Fall,2009,0,0,0,0,0,0,0,0.0,0,WRIT,5,1.0,0,0,0,0,0,0,0,0,0",
].join("\n");

const [CMPSC, WRIT] = parseNexusCsv(CSV);

const lecture = (
  sectionId: string,
  number: string,
  familyName: string,
  givenName: string
): Lecture => ({
  sectionId,
  number,
  courseId: "CMPSC 130A",
  subject: "CMPSC",
  courseNumber: "130A",
  meetings: [{ instructors: [{ familyName, givenName }] }],
});

describe("parseNexusCsv", () => {
  it("reads rows by column name", () => {
    assert.equal(CMPSC.course, "CMPSC   130A");
    assert.equal(CMPSC.instructor, "SURI S");
    assert.equal(CMPSC.quarter, "Fall");
    assert.equal(CMPSC.Ap, "5");
  });

  it("handles quoted fields and blank lines", () => {
    const rows = parseNexusCsv('a,b\n"x, y","say ""hi"""\n\n');
    assert.deepEqual(rows, [{ a: "x, y", b: 'say "hi"' }]);
  });
});

describe("nexusTermId and nexusCourseId", () => {
  it("maps quarters and course ids to the catalog's", () => {
    assert.equal(nexusTermId("Fall", "2024"), "20244");
    assert.equal(nexusTermId("Winter", "2025"), "20251");
    assert.equal(nexusTermId("Summer", "2026"), "20263");
    assert.equal(nexusTermId("Fall", "soon"), null);
    assert.equal(nexusCourseId("CMPSC   130A"), "CMPSC 130A");
    assert.equal(nexusCourseId("AS AM   127"), "AS AM 127");
  });
});

describe("toGradeCounts", () => {
  it("maps letter grades with plus and minus", () => {
    const counts = toGradeCounts(CMPSC);
    assert.equal(counts.countAPlus, 5);
    assert.equal(counts.countA, 40);
    assert.equal(counts.countAMinus, 15);
    assert.equal(counts.countBPlus, 12);
    assert.equal(counts.countF, 3);
    assert.equal(
      counts.count,
      5 + 40 + 15 + 12 + 30 + 9 + 6 + 10 + 4 + 1 + 2 + 1 + 3
    );
  });

  it("maps satisfactory and unsatisfactory grades", () => {
    const counts = toGradeCounts(WRIT);
    assert.equal(counts.countS, 5);
    assert.equal(counts.countU, 1);
    assert.equal(counts.count, 6);
  });

  it("derives no-pass counts from pass/no pass enrollment", () => {
    const row = { ...CMPSC, nPNPStudents: "50", P: "46" };
    const counts = toGradeCounts(row);
    assert.equal(counts.countP, 46);
    assert.equal(counts.countNP, 4);
  });
});

describe("addGradeCounts", () => {
  it("sums two rows for the same lecture", () => {
    const sum = addGradeCounts(toGradeCounts(CMPSC), toGradeCounts(CMPSC));
    assert.equal(sum.countA, 80);
    assert.equal(sum.count, toGradeCounts(CMPSC).count * 2);
  });
});

describe("matchGradeRow", () => {
  it("matches the lecture taught by the row's instructor", () => {
    const match = matchGradeRow(CMPSC, [
      lecture("1", "0100", "WANG", "Y X"),
      lecture("2", "0200", "SURI", "S"),
    ]);
    assert.equal(match?.sectionId, "2");
  });

  it("credits the first lecture when the instructor taught several", () => {
    const match = matchGradeRow(CMPSC, [
      lecture("2", "0200", "SURI", "S"),
      lecture("1", "0100", "SURI", "S"),
    ]);
    assert.equal(match?.sectionId, "1");
  });

  it("uses the only lecture even if the instructor differs", () => {
    assert.equal(
      matchGradeRow(CMPSC, [lecture("1", "0100", "STAFF", "")])?.sectionId,
      "1"
    );
  });

  it("refuses to guess between other instructors' lectures", () => {
    assert.equal(
      matchGradeRow(CMPSC, [
        lecture("1", "0100", "WANG", "Y X"),
        lecture("2", "0200", "LEE", "K"),
      ]),
      null
    );
    assert.equal(matchGradeRow(CMPSC, []), null);
  });
});

describe("toGradeDistribution", () => {
  it("attaches the counts to the lecture's section", () => {
    const record = toGradeDistribution(
      "20244",
      lecture("29140", "0100", "SURI", "S"),
      toGradeCounts(CMPSC)
    );
    assert.equal(record.termId, "20244");
    assert.equal(record.sectionId, "29140");
    assert.equal(record.sectionNumber, "0100");
    assert.equal(record.courseId, "CMPSC 130A");
    assert.equal(record.countA, 40);
  });
});
