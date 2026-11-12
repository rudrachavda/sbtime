import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { Data } from "../src/types";
import {
  UCSB_COMPUTER_SCIENCE_BTLL,
  UCSB_ENGINEERING_GE_BTLL,
  UCSB_UNIVERSITY_REQ_BTLL,
} from "./index";
import {
  type Result,
  type TestCourse,
  byName,
  course,
  courses,
  run,
} from "./test-helpers";

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

describe("Computer Science (Engineering) 2026-27", () => {
  const preparation = [
    "CMPSC 16",
    "CMPSC 24",
    "CMPSC 32",
    "CMPSC 41",
    "CMPSC 42",
    "CMPSC 64",
    "MATH 3A",
    "MATH 3B",
    "MATH 4A",
    "MATH 4B",
    "MATH 6A",
    "PSTAT 120A",
  ].map((name) => course(name));
  const upperDivision = ["CMPSC 130A", "CMPSC 130B", "ENGR 101"].map((name) =>
    course(name)
  );
  const cmpscElectives = [
    "CMPSC 138",
    "CMPSC 154",
    "CMPSC 156",
    "CMPSC 160",
    "CMPSC 170",
    "CMPSC 174A",
    "CMPSC 176A",
    "CMPSC 190N",
  ].map((name) => course(name));
  const otherElectives = [
    "PSTAT 120B",
    "PSTAT 122",
    "MATH 108A",
    "ECE 152A",
    "ECE 181",
    "MATH 124A",
  ].map((name) => course(name));

  const results = (courses: TestCourse[]) =>
    byName(run(UCSB_COMPUTER_SCIENCE_BTLL, courses));

  test("a plan without science courses misses only the science electives", () => {
    const all = run(UCSB_COMPUTER_SCIENCE_BTLL, [
      ...preparation,
      ...upperDivision,
      ...cmpscElectives,
      ...otherElectives,
    ]);
    assert.deepEqual(
      all.map((r) => [r.description.data, r.result.data]),
      [
        ["Preparation for the Major", true],
        ["Upper-Division Required Courses", true],
        ["Major Field Electives", true],
        ["Science Electives: List A (8 units) and List B (12 units)", false],
      ]
    );
  });

  describe("science electives", () => {
    const SCIENCE = "Science Electives: List A (8 units) and List B (12 units)";
    const science = (planned: TestCourse[]) => results(planned).get(SCIENCE);
    const physicsSeries = [
      course("PHYS 7A"),
      course("PHYS 7B"),
      course("PHYS 7C"),
      course("PHYS 7L", [], 1),
    ];

    test("List A courses and a List B series with a lab meet both lists", () => {
      assert.equal(
        science([...physicsSeries, course("ASTRO 1"), course("ECON 1")]),
        true
      );
    });

    test("List B needs a lab", () => {
      const noLab = courses(
        "PHYS 7A",
        "PHYS 7B",
        "PHYS 7C",
        "ASTRO 1",
        "ECON 1"
      );
      const r = results(noLab);
      assert.equal(r.get("List B: 12 units"), true);
      assert.equal(r.get("List B: at least one lab"), false);
      assert.equal(r.get(SCIENCE), false);
    });

    test("a course on both lists counts toward only one", () => {
      // CHEM 1A, 1B and 1C (12 units) can fill List B or List A, not both.
      const chem = courses("CHEM 1A", "CHEM 1B", "CHEM 1C");
      const lab = course("CHEM 2AL", [], 2);
      assert.equal(science([...chem, lab]), false);
      assert.equal(
        science([...chem, lab, course("ASTRO 1"), course("EARTH 2")]),
        true
      );
    });

    test("PHYS 4 counts for List A only with PHYS 4L", () => {
      const listB = [...physicsSeries];
      assert.equal(
        science([...listB, course("PHYS 4"), course("ASTRO 1")]),
        false
      );
      assert.equal(
        science([...listB, course("PHYS 4"), course("PHYS 4L", [], 4)]),
        true
      );
    });

    test("the biology group counts for List A and leaves MCDB 1B out of List B", () => {
      const group = [
        course("MCDB 1B"),
        course("EEMB 2"),
        course("EEMB 2L", [], 2),
      ];
      const r = results([...group, ...courses("PHYS 7A", "PHYS 7B")]);
      assert.equal(r.get("List A: 8 units"), true);
      // MCDB 1B went to the group, so List B has only 8 units.
      assert.equal(r.get("List B: 12 units"), false);
    });

    test("online versions count", () => {
      assert.equal(
        science([...physicsSeries, ...courses("EARTHW 20", "GEOGW 12")]),
        true
      );
    });

    test("AP Biology can be ticked off for List A by hand", () => {
      const r = results(physicsSeries);
      assert.equal(r.get("Science Electives List B"), true);
      assert.equal(
        r.get("AP Biology exam, score of 3 or higher (8 units of List A)"),
        false
      );
    });
  });

  test("a missing preparation course fails preparation only", () => {
    const r = results([
      ...preparation.filter((c) => c.number.data !== "6A"),
      ...upperDivision,
    ]);
    assert.equal(r.get("Mathematics and Statistics"), false);
    assert.equal(r.get("Computer Science"), true);
    assert.equal(r.get("Upper-Division Required Courses"), true);
  });

  test("14 electives with only 6 CMPSC fail the CMPSC minimum", () => {
    const r = results([
      ...cmpscElectives.slice(0, 6),
      ...otherElectives,
      course("PSTAT 130"),
      course("MATH 119A"),
    ]);
    assert.equal(r.get("14 Major Field Electives"), true);
    assert.equal(r.get("At least 7 CMPSC Electives"), false);
  });

  test("CMPSC 192 and 196 together count as one elective", () => {
    const r = results([
      ...cmpscElectives.slice(0, 6),
      course("CMPSC 192", [], 2),
      course("CMPSC 196", [], 2),
      ...otherElectives,
    ]);
    // 6 + 1 CMPSC, 6 others: 13 electives.
    assert.equal(r.get("At least 7 CMPSC Electives"), true);
    assert.equal(r.get("14 Major Field Electives"), false);
  });

  test("courses off the list do not count as electives", () => {
    const r = results([
      course("CMPSC 8"),
      course("CMPSC 190"),
      course("ECE 10A"),
    ]);
    assert.equal(r.get("At least 7 CMPSC Electives"), false);
    const electives = run(UCSB_COMPUTER_SCIENCE_BTLL, [
      course("CMPSC 8"),
      course("CMPSC 190"),
      course("ECE 10A"),
    ])[2] as Result & { requirements: Data<Result[]> };
    const total = electives.requirements.data[0] as Result & {
      actual_count: Data<number>;
    };
    assert.equal(total.actual_count.data, 0);
  });
});
