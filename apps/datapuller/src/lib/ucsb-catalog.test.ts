import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import type { UcsbClass } from "@repo/ucsb-api";

import {
  CatalogTerm,
  buildCatalogNames,
  formatGeneralEducation,
  mapQuarter,
  parseCourseId,
  parseDays,
  parseInstructorName,
} from "./ucsb-catalog";

// Seven real courses from UCSB's Fall 2026 class search.
const { classes: FIXTURE } = JSON.parse(
  readFileSync(
    new URL("./fixtures/ucsb-classes-20264.json", import.meta.url),
    "utf8"
  )
) as { classes: UcsbClass[] };

const TERM: CatalogTerm = {
  id: "20264",
  year: 2026,
  semester: "Fall",
  beginDate: "2026-09-24",
  endDate: "2026-12-11",
};

const NOW = new Date("2026-11-10T12:00:00Z");

const mapped = mapQuarter(FIXTURE, TERM, new Map(), NOW);

const classesOf = (courseId: string) =>
  mapped.classes.filter((c) => c.courseId === courseId);
const sectionsOf = (courseId: string) =>
  mapped.sections.filter((s) => s.courseId === courseId);

describe("parseCourseId", () => {
  it("splits the fixed-width id into subject and number", () => {
    assert.deepEqual(parseCourseId("ANTH      3  "), {
      courseId: "ANTH 3",
      subjectName: "ANTH",
      subject: "ANTH",
      number: "3",
    });
    assert.equal(parseCourseId("ANTH    245IA")?.number, "245IA");
    assert.equal(parseCourseId("CMPSC   130A ")?.courseId, "CMPSC 130A");
  });

  it("keeps the space in the name of two-word subjects but not in the stored subject", () => {
    assert.deepEqual(parseCourseId("AS AM   127  ", "AS AM   "), {
      courseId: "AS AM 127",
      subjectName: "AS AM",
      subject: "ASAM",
      number: "127",
    });
    assert.equal(
      parseCourseId("ART  CS 199  ", "ART  CS ")?.courseId,
      "ART CS 199"
    );
  });

  it("rejects ids without a subject or number", () => {
    assert.equal(parseCourseId(""), null);
    assert.equal(parseCourseId("ANTH         "), null);
  });
});

describe("parseDays", () => {
  it("reads one flag per weekday, Monday first", () => {
    assert.deepEqual(parseDays("M W F  "), [
      true,
      false,
      true,
      false,
      true,
      false,
      false,
    ]);
    assert.deepEqual(parseDays(" T R   "), [
      false,
      true,
      false,
      true,
      false,
      false,
      false,
    ]);
    assert.deepEqual(parseDays("     S "), [
      false,
      false,
      false,
      false,
      false,
      true,
      false,
    ]);
  });

  it("treats missing or short values as no days", () => {
    assert.deepEqual(parseDays(null), Array(7).fill(false));
    assert.deepEqual(parseDays("M"), [
      true,
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
  });
});

describe("parseInstructorName", () => {
  it("separates the family name from trailing initials", () => {
    assert.deepEqual(parseInstructorName("SMITH S T"), {
      familyName: "SMITH",
      givenName: "S T",
    });
    assert.deepEqual(parseInstructorName("DE LA CRUZ M"), {
      familyName: "DE LA CRUZ",
      givenName: "M",
    });
  });

  it("handles names without initials and empty values", () => {
    assert.deepEqual(parseInstructorName("STAFF"), {
      familyName: "STAFF",
      givenName: "",
    });
    assert.equal(parseInstructorName("  "), null);
    assert.equal(parseInstructorName(null), null);
  });
});

describe("formatGeneralEducation", () => {
  const tags = formatGeneralEducation([
    { geCode: "D  ", geCollege: "L&S " },
    { geCode: "D  ", geCollege: "ENGR" },
    { geCode: "WRT", geCollege: "L&S " },
    { geCode: "AMH", geCollege: "UCSB" },
    { geCode: "D  ", geCollege: "L&S " },
  ]);

  it("labels areas by college and names special subjects", () => {
    assert.deepEqual(
      tags.sectionAttributes.map((attribute) => attribute.value.description),
      ["Engineering: Area D", "L&S: Area D", "L&S: Writing"]
    );
    assert.ok(tags.sectionAttributes.every((a) => a.attribute.code === "GE"));
  });

  it("stores campus-wide requirements as the requirement designation", () => {
    assert.equal(tags.requirementDesignation?.code, "AMH");
    assert.equal(
      tags.requirementDesignation?.description,
      "American History & Institutions"
    );
  });

  it("drops duplicates and tolerates no data", () => {
    assert.deepEqual(tags.codes, ["L&S:D", "ENGR:D", "L&S:WRT", "UCSB:AMH"]);
    assert.deepEqual(formatGeneralEducation(null).sectionAttributes, []);
  });
});

describe("mapQuarter", () => {
  it("creates one course per UCSB course", () => {
    assert.equal(mapped.courses.length, FIXTURE.length);
    assert.equal(
      new Set(mapped.courses.map((c) => c.courseId)).size,
      FIXTURE.length
    );
  });

  it("maps a lecture with discussions (ANTH 3)", () => {
    const [anth3] = classesOf("ANTH 3");
    const sections = sectionsOf("ANTH 3");
    const lecture = sections.find((s) => s.primary);

    assert.equal(classesOf("ANTH 3").length, 1);
    assert.equal(anth3.number, "0100");
    assert.equal(anth3.termId, "20264");
    assert.equal(anth3.semester, "Fall");
    assert.deepEqual(anth3.allowedUnits, { minimum: 5, maximum: 5 });
    assert.equal(anth3.anyPrintInScheduleOfClasses, true);

    assert.equal(sections.length, 3);
    assert.ok(sections.every((s) => s.classNumber === "0100"));
    assert.equal(lecture?.sectionId, "00018");
    assert.equal(lecture?.component, "LEC");
    assert.deepEqual(lecture?.associatedSectionIds, [
      "00026",
      sections[2].sectionId,
    ]);
    assert.deepEqual(
      sections.filter((s) => !s.primary).map((s) => s.component),
      ["DIS", "DIS"]
    );
  });

  it("maps meeting days, times, location and instructor", () => {
    const lecture = sectionsOf("ANTH 3").find((s) => s.primary);
    const meeting = lecture?.meetings?.[0];

    assert.deepEqual(meeting?.days, [
      true,
      false,
      true,
      false,
      true,
      false,
      false,
    ]);
    assert.equal(meeting?.startTime, "14:00:00");
    assert.equal(meeting?.endTime, "14:50:00");
    assert.equal(meeting?.location, "IV THEA1");
    assert.equal(meeting?.startDate, "2026-09-24");
    assert.deepEqual(meeting?.instructors, [
      {
        printInScheduleOfClasses: true,
        familyName: "SMITH",
        givenName: "S T",
        role: "PI",
      },
    ]);
  });

  it("puts GE tags on the primary section only", () => {
    const sections = sectionsOf("ANTH 3");
    const lecture = sections.find((s) => s.primary);

    assert.deepEqual(
      lecture?.sectionAttributes?.map((a) => a.value.description),
      [
        "Engineering: Area D",
        "Engineering: World Cultures",
        "Engineering: Writing",
        "L&S: Area D",
        "L&S: World Cultures",
        "L&S: Writing",
      ]
    );
    assert.ok(
      sections.filter((s) => !s.primary).every((s) => !s.sectionAttributes)
    );
  });

  it("makes each lecture its own class (ANTH 195B)", () => {
    assert.deepEqual(
      classesOf("ANTH 195B").map((c) => c.number),
      ["0100", "0200"]
    );
    assert.deepEqual(
      sectionsOf("ANTH 195B").map((s) => [s.classNumber, s.primary]),
      [
        ["0100", true],
        ["0200", true],
      ]
    );
  });

  it("drops cancelled lectures (CNCSP 97)", () => {
    assert.deepEqual(
      classesOf("CNCSP 97").map((c) => c.number),
      ["0200"]
    );
    assert.equal(sectionsOf("CNCSP 97").length, 1);
  });

  it("maps variable units to a range (ANTH 99)", () => {
    assert.deepEqual(classesOf("ANTH 99")[0].allowedUnits, {
      minimum: 1,
      maximum: 4,
    });
    assert.deepEqual(
      mapped.courses.find((c) => c.courseId === "ANTH 99")?.credit,
      { type: "range", value: { range: { minUnits: 1, maxUnits: 4 } } }
    );
  });

  it("stores two-word subjects without the space (AS AM 127)", () => {
    const course = mapped.courses.find((c) => c.courseId === "AS AM 127");

    assert.equal(course?.subject, "ASAM");
    assert.equal(course?.subjectName, "AS AM");
    assert.equal(classesOf("AS AM 127")[0].subject, "ASAM");
  });

  it("marks graduate and undergraduate courses", () => {
    const career = (id: string) =>
      mapped.courses.find((c) => c.courseId === id)?.academicCareer;

    assert.equal(career("ANTH 245IA"), "GRAD");
    assert.equal(career("ANTH 3"), "UGRD");
  });

  it("records campus-wide requirements on the class (BL ST 1)", () => {
    assert.equal(classesOf("BL ST 1")[0].requirementDesignation?.code, "AMH");
    assert.equal(classesOf("ANTH 3")[0].requirementDesignation, undefined);
  });

  it("takes a seat-count snapshot for every section", () => {
    const snapshot = (sectionId: string) =>
      mapped.enrollments.find((e) => e.sectionId === sectionId)?.snapshot;

    assert.equal(mapped.enrollments.length, mapped.sections.length);
    assert.deepEqual(
      [
        snapshot("00018")?.enrolledCount,
        snapshot("00018")?.maxEnroll,
        snapshot("00018")?.status,
      ],
      [361, 400, "O"]
    );
    // 28 of 28 seats taken.
    assert.equal(snapshot(sectionsOf("ANTH 3")[2].sectionId)?.status, "C");
    // UCSB flags AS AM 127 closed (47 enrolled, 45 seats).
    assert.equal(snapshot(sectionsOf("AS AM 127")[0].sectionId)?.status, "C");
    // No enrolment reported yet counts as zero.
    assert.equal(
      snapshot(sectionsOf("ANTH 99")[0].sectionId)?.enrolledCount,
      0
    );
  });

  it("links every section to a class and uses unique section ids", () => {
    const classKeys = new Set(
      mapped.classes.map((c) => `${c.courseId}|${c.number}`)
    );

    assert.ok(
      mapped.sections.every((s) =>
        classKeys.has(`${s.courseId}|${s.classNumber}`)
      )
    );
    assert.equal(
      new Set(mapped.sections.map((s) => s.sectionId)).size,
      mapped.sections.length
    );
    assert.equal(
      mapped.sections.filter((s) => s.primary).length,
      mapped.classes.length
    );
  });

  it("prefers cached General Catalog details over the API's text", () => {
    const details = new Map([
      [
        "ANTH 3",
        {
          title: "World Archaeology",
          description: "A clean description.",
          prerequisites: "None required, but ANTH 2 recommended.",
        },
      ],
    ]);
    const enriched = mapQuarter(FIXTURE, TERM, details, NOW);
    const course = enriched.courses.find((c) => c.courseId === "ANTH 3");
    const [anth3] = enriched.classes.filter((c) => c.courseId === "ANTH 3");

    assert.equal(course?.title, "World Archaeology");
    assert.equal(course?.description, "A clean description.");
    assert.equal(
      course?.preparation?.requiredText,
      "None required, but ANTH 2 recommended."
    );
    assert.equal(anth3.title, "World Archaeology");
    assert.equal(anth3.requisites, "None required, but ANTH 2 recommended.");

    // Without details the API's abbreviated title is used.
    assert.equal(
      mapped.courses.find((c) => c.courseId === "ANTH 3")?.title,
      "WORLD ARCHAEOLOGY"
    );
  });

  it("reports nothing unknown for this sample", () => {
    assert.deepEqual(mapped.unknownInstructionTypes, []);
  });
});

describe("buildCatalogNames", () => {
  const names = buildCatalogNames(
    [
      {
        subjectCode: "AS AM",
        subjectTranslation: "Asian American Studies",
        deptCode: "ASAM",
        collegeCode: "L&S",
        relatedDeptCode: null,
        inactive: false,
      },
      {
        subjectCode: "ART  CS",
        subjectTranslation: "Art (Creative Studies)",
        deptCode: "CRSTU",
        collegeCode: "CRST",
        relatedDeptCode: null,
        inactive: false,
      },
      {
        subjectCode: "ANTH",
        subjectTranslation: " Anthropology ",
        deptCode: "ANTH",
        collegeCode: "L&S",
        relatedDeptCode: null,
        inactive: false,
      },
    ],
    [
      {
        deptCode: "EALCS",
        deptTranslationShort: "E As Lng & Clt",
        deptTranslation: "East Asian Languages & Cultural Studies",
        collegeCode: "L&S",
        divisionCode: null,
        orgCode: null,
        inactive: false,
      },
      {
        deptCode: "ANTH ",
        deptTranslationShort: "Anthropology",
        deptTranslation: "Anthropology",
        collegeCode: "L&S",
        divisionCode: null,
        orgCode: null,
        inactive: false,
      },
    ]
  );

  it("keys subjects the way they are stored, without spaces", () => {
    assert.equal(names.subjects.get("ASAM"), "Asian American Studies");
    assert.equal(names.subjects.get("ARTCS"), "Art (Creative Studies)");
    assert.equal(names.subjects.get("ANTH"), "Anthropology");
  });

  it("keys departments by trimmed code and uses the full name", () => {
    assert.equal(
      names.departments.get("EALCS"),
      "East Asian Languages & Cultural Studies"
    );
    assert.equal(names.departments.get("ANTH"), "Anthropology");
  });

  it("puts full names on courses and falls back to codes", () => {
    const withNames = mapQuarter(FIXTURE, TERM, new Map(), NOW, names);
    const course = (id: string) =>
      withNames.courses.find((c) => c.courseId === id);

    assert.equal(course("AS AM 127")?.subjectName, "Asian American Studies");
    assert.equal(course("ANTH 3")?.academicOrganizationName, "Anthropology");
    // No names loaded: codes stand in, so filters still have labels.
    const plain = mapped.courses.find((c) => c.courseId === "ANTH 3");
    assert.equal(plain?.subjectName, "ANTH");
    assert.equal(plain?.academicOrganizationName, "ANTH");
  });
});
