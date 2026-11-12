import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { init } from "../src/interpreter";
import type { Data } from "../src/types";
import { UCSB_ENGINEERING_GE_BTLL, UCSB_UNIVERSITY_REQ_BTLL } from "./index";

interface Result {
  result: Data<boolean>;
  description: Data<string>;
  requirements?: Data<Result[]>;
}

const course = (
  name: string,
  tags: string[] = [],
  units = 4,
  universityRequirement = ""
) => {
  const [subject, ...rest] = name.split(" ");
  return {
    subject: { data: subject, type: "string" },
    number: { data: rest.join(" "), type: "string" },
    units: { data: units, type: "number" },
    universityRequirement: { data: universityRequirement, type: "string" },
    breadthRequirements: { data: tags, type: "List<string>" },
    languageLevel: { data: "", type: "string" },
  };
};

type TestCourse = ReturnType<typeof course>;

const run = (code: string, courses: TestCourse[], extraUnits = 0) => {
  const units =
    courses.reduce((sum, c) => sum + c.units.data, 0) + extraUnits;
  const plan = {
    units: { data: units, type: "number" },
    columns: { data: [], type: "List<Column>" },
    allCourses: { data: courses, type: "List<Course>" },
  };
  const variables = new Map<string, Data<unknown>>([
    ["this", { data: plan, type: "Plan" }],
    ["columns", { data: [], type: "List<Column>" }],
  ]);
  return init(code, variables, {}) as Result[];
};

const byName = (results: Result[]) => {
  const all = new Map<string, boolean>();
  const walk = (list: Result[]) => {
    for (const r of list) {
      all.set(r.description.data, r.result.data);
      if (r.requirements) walk(r.requirements.data);
    }
  };
  walk(results);
  return all;
};

describe("UCSB university requirements", () => {
  test("nothing planned meets nothing", () => {
    const results = byName(run(UCSB_UNIVERSITY_REQ_BTLL, []));
    assert.equal(results.get("Entry Level Writing"), false);
    assert.equal(results.get("American History & Institutions"), false);
    assert.equal(results.get("Minimum 180 Units"), false);
  });

  test("a Writing 1 course, an AMH course and 180 units meet all three", () => {
    const results = byName(
      run(
        UCSB_UNIVERSITY_REQ_BTLL,
        [
          course("WRIT 1", [], 4, "SUB"),
          course("HIST 17A", ["L&S:D", "ENGR:D"], 4, "AMH"),
        ],
        172
      )
    );
    assert.equal(results.get("Entry Level Writing"), true);
    assert.equal(results.get("American History & Institutions"), true);
    assert.equal(results.get("Minimum 180 Units"), true);
  });

  test("an Area A course implies Entry Level Writing", () => {
    const results = byName(
      run(UCSB_UNIVERSITY_REQ_BTLL, [course("WRIT 2E", ["ENGR:A1"])])
    );
    assert.equal(results.get("Entry Level Writing"), true);
  });
});

describe("College of Engineering GE (2026-27)", () => {
  const complete = [
    course("WRIT 2E", ["ENGR:A1"]),
    course("WRIT 50E", ["ENGR:A2", "ENGR:WRT"]),
    course("ECON 1", ["ENGR:D"]),
    course("ECON 2", ["ENGR:D"]),
    course("PHIL 3", ["ENGR:E", "ENGR:WRT"]),
    course("HIST 2A", ["ENGR:E", "ENGR:EUR", "ENGR:WRT"]),
    course("ARTHI 6A", ["ENGR:F"]),
    course("ENGL 15", ["ENGR:G", "ENGR:WRT"]),
    course("AS AM 1", ["ENGR:D", "ENGR:ETH"]),
  ];

  test("a complete pattern meets every requirement", () => {
    const results = run(UCSB_ENGINEERING_GE_BTLL, complete);
    assert.deepEqual(
      results.map((r) => [r.description.data, r.result.data]),
      [
        ["Area A: English Reading & Composition", true],
        ["Areas D, E, F and G", true],
        ["Special Subject Areas", true],
      ]
    );
  });

  test("one course in two areas counts toward only one", () => {
    // ENGL 10 is both E and G; with one other E course, E is one short.
    const results = byName(
      run(UCSB_ENGINEERING_GE_BTLL, [
        course("ECON 1", ["ENGR:D"]),
        course("ECON 2", ["ENGR:D"]),
        course("PHIL 3", ["ENGR:E"]),
        course("ENGL 10", ["ENGR:E", "ENGR:G"]),
        course("ARTHI 6A", ["ENGR:F"]),
        course("ARTHI 6B", ["ENGR:F"]),
      ])
    );
    assert.equal(results.get("Area G: Literature (1 course)"), true);
    assert.equal(results.get("Area E: Culture and Thought (2 courses)"), false);
    assert.equal(results.get("At least 6 courses in Areas D-G"), true);
  });

  test("an F/E course goes to E when another F course exists", () => {
    const results = byName(
      run(UCSB_ENGINEERING_GE_BTLL, [
        course("ARTHI 6A", ["ENGR:E", "ENGR:F"]),
        course("MUS 15", ["ENGR:F"]),
        course("PHIL 3", ["ENGR:E"]),
      ])
    );
    assert.equal(results.get("Area F: The Arts (1 course)"), true);
    assert.equal(results.get("Area E: Culture and Thought (2 courses)"), true);
  });

  test("Letters & Science tags do not count for Engineering", () => {
    const results = byName(
      run(UCSB_ENGINEERING_GE_BTLL, [course("ECON 1", ["L&S:D"])])
    );
    assert.equal(results.get("Area D: Social Sciences (2 courses)"), false);
  });

  test("missing writing courses fail only the writing requirement", () => {
    const withoutWriting = complete.map((c) =>
      course(
        `${c.subject.data} ${c.number.data}`,
        c.breadthRequirements.data.filter((tag) => tag !== "ENGR:WRT")
      )
    );
    const results = byName(run(UCSB_ENGINEERING_GE_BTLL, withoutWriting));
    assert.equal(results.get("Writing (4 courses)"), false);
    assert.equal(results.get("Ethnicity"), true);
    assert.equal(results.get("Areas D, E, F and G"), true);
  });
});
