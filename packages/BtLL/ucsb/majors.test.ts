import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  UCSB_ARTIFICIAL_INTELLIGENCE_BTLL,
  UCSB_CHEMICAL_ENGINEERING_BTLL,
  UCSB_COMPUTER_ENGINEERING_BTLL,
  UCSB_ELECTRICAL_ENGINEERING_BTLL,
  UCSB_MECHANICAL_ENGINEERING_BTLL,
} from "./index";
import { byName, course, courses, run, summary } from "./test-helpers";

describe("Artificial Intelligence 2026-27", () => {
  const required = courses(
    "CMPSC 1A",
    "CMPSC 9",
    "CMPSC 25",
    "CMPSC 41",
    "CMPSC 42",
    "MATH 3A",
    "MATH 3B",
    "MATH 4A",
    "MATH 4B",
    "MATH 6A",
    "ECE 139",
    "CMPSC 130A",
    "CMPSC 130B",
    "CMPSC 135",
    "CMPSC 165A",
    "CMPSC 165B",
    "CMPSC 183",
    "CMPSC 187",
    "CMPSC 188",
    "ECE 181"
  );
  const electives = courses(
    "CMPSC 110",
    "CMPSC 111",
    "CMPSC 132",
    "CMPSC 134",
    "CMPSC 138",
    "CMPSC 140",
    "CMPSC 148",
    "ECE 180",
    "CMPSC 190N"
  );

  test("a complete plan meets everything but the hand-checked science electives", () => {
    const results = run(UCSB_ARTIFICIAL_INTELLIGENCE_BTLL, [
      ...required,
      ...electives,
    ]);
    assert.deepEqual(summary(results).slice(0, 3), [
      ["Preparation for the Major", true],
      ["Upper-Division Required Courses", true],
      ["9 Major Field Electives", true],
    ]);
    assert.equal(results[3].result.data, false);
  });

  test("C LIT 155, GER 155 and one of CMPSC 192/196 count as electives", () => {
    const r = byName(
      run(UCSB_ARTIFICIAL_INTELLIGENCE_BTLL, [
        ...electives.slice(0, 6),
        ...courses("CLIT 155", "GER 155"),
        course("CMPSC 192", [], 2),
        course("CMPSC 196", [], 2),
      ])
    );
    // 6 + 2 + 1 (192 and 196 together) = 9.
    assert.equal(r.get("9 Major Field Electives"), true);
  });

  test("CMPSC 181 or ECE 181 is required", () => {
    const r = byName(
      run(
        UCSB_ARTIFICIAL_INTELLIGENCE_BTLL,
        required.filter((c) => c.number.data !== "181")
      )
    );
    assert.equal(r.get("CMPSC 181 or ECE 181"), false);
    assert.equal(r.get("Required Courses"), true);
  });
});

describe("Chemical Engineering 2026-27", () => {
  const preparation = courses(
    "CHE 5",
    "CHE 10",
    "ENGR 3",
    "CHEM 1A",
    "CHEM 1B",
    "CHEM 1C",
    "CHEM 2AL",
    "CHEM 2BL",
    "CHEM 6AL",
    "CHEM 6BL",
    "CHEM 109A",
    "CHEM 130B",
    "MATH 3A",
    "MATH 3B",
    "MATH 4AI",
    "MATH 4B",
    "MATH 6A",
    "MATH 6B",
    "PHYS 7A",
    "PHYS 7B",
    "PHYS 7C",
    "PHYS 7L"
  );
  const upperDivision = courses(
    "CHE 107",
    "CHE 110A",
    "CHE 110B",
    "CHE 118",
    "CHE 120A",
    "CHE 120B",
    "CHE 120C",
    "CHE 128",
    "CHE 132A",
    "CHE 132B",
    "CHE 132C",
    "CHE 140A",
    "CHE 140B",
    "CHE 152A",
    "CHE 180A",
    "CHE 180B",
    "CHE 184A",
    "CHE 184B",
    "CHEM 113B",
    "CHEM 113C",
    "MATRL 100C"
  );
  const electives = [
    course("CHE 102", [], 3),
    course("CHE 121", [], 3),
    course("ME 110", [], 4),
    course("CHEM 123", [], 4),
    course("MATH 122A", [], 4),
  ];

  test("a complete plan meets every requirement", () => {
    const results = run(
      UCSB_CHEMICAL_ENGINEERING_BTLL,
      [...preparation, ...upperDivision, ...electives],
      40
    );
    assert.deepEqual(summary(results), [
      ["Preparation for the Major", true],
      ["Upper-Division Required Courses", true],
      ["Technical Electives", true],
      ["Minimum 187 Units for Chemical Engineering", true],
    ]);
  });

  test("15 elective units with only 6 in engineering departments fall short", () => {
    const r = byName(
      run(UCSB_CHEMICAL_ENGINEERING_BTLL, [
        course("CHE 102", [], 3),
        course("CHE 121", [], 3),
        course("CHEM 123", [], 4),
        course("MATH 122A", [], 4),
        course("PHYS 123A", [], 4),
      ])
    );
    assert.equal(r.get("15 Units of Technical Electives"), true);
    assert.equal(r.get("9 of Them in CH E, ECE, MATRL or ME"), false);
  });

  test("CH E 196 and 198 count for at most 3 units", () => {
    const r = byName(
      run(UCSB_CHEMICAL_ENGINEERING_BTLL, [
        course("CHE 102", [], 3),
        course("CHE 196", [], 4),
        course("CHE 198", [], 4),
      ])
    );
    // 3 + 3 = 6 department units, not 11.
    assert.equal(r.get("9 of Them in CH E, ECE, MATRL or ME"), false);
  });

  test("CHEM 3A-B-C satisfies general chemistry too", () => {
    const r = byName(
      run(
        UCSB_CHEMICAL_ENGINEERING_BTLL,
        courses("CHEM 3A", "CHEM 3B", "CHEM 3C")
      )
    );
    assert.equal(r.get("General Chemistry: CHEM 3A-B-C or 1A-B-C"), true);
  });
});

describe("Computer Engineering 2026-27", () => {
  const preparation = [
    ...courses(
      "CMPSC 16",
      "CMPSC 24",
      "CMPSC 32",
      "CMPSC 41",
      "ECE 5",
      "ECE 10A",
      "ECE 10B",
      "ECE 10C",
      "ECE 15A",
      "MATH 2A",
      "MATH 2B",
      "MATH 4A",
      "MATH 4B",
      "MATH 6A",
      "PHYS 7A",
      "PHYS 7B",
      "PHYS 7C",
      "PHYS 7D"
    ),
    ...["ECE 1A", "ECE 1B", "ECE 10AL", "ECE 10BL", "ECE 10CL", "PHYS 7L"].map(
      (name) => course(name, [], 1)
    ),
  ];
  const upperDivision = courses(
    "CMPSC 130A",
    "ECE 139",
    "ECE 152A",
    "ECE 154A",
    "ENGR 101"
  );
  const eceCapstone = courses("ECE 189A", "ECE 189B", "ECE 189C");
  const nineElectives = courses(
    "ECE 122A",
    "ECE 122B",
    "ECE 123",
    "ECE 130A",
    "ECE 130B",
    "ECE 147A",
    "ECE 147B",
    "ECE 160",
    "ECE 194BB"
  );

  const SEQUENCES =
    "At least 2 approved elective sequences (ECE Department list)";
  const sequencesMet = (...names: string[]) =>
    byName(run(UCSB_COMPUTER_ENGINEERING_BTLL, courses(...names))).get(
      SEQUENCES
    );

  test("a complete plan meets every requirement", () => {
    // The electives include the VLSI, Signals & Systems and Real-Time
    // sequences.
    const results = run(
      UCSB_COMPUTER_ENGINEERING_BTLL,
      [...preparation, ...upperDivision, ...eceCapstone, ...nineElectives],
      60
    );
    assert.deepEqual(summary(results), [
      ["Preparation for the Major", true],
      ["Upper-Division Required Courses", true],
      ["Computer Engineering Electives", true],
      ["Minimum 191 Units for Computer Engineering", true],
    ]);
    const r = byName(results);
    assert.equal(r.get("Elective Units: 40 or 36 with ECE 189A-B-C"), true);
  });

  test("two complete sequences are required", () => {
    assert.equal(
      sequencesMet("CMPSC 165A", "CMPSC 165B", "ECE 179D", "ECE 179P"),
      true
    );
    assert.equal(sequencesMet("CMPSC 165A", "CMPSC 165B", "ECE 179D"), false);
  });

  test("either listing of a cross-listed course counts", () => {
    assert.equal(
      sequencesMet("CMPSC 153A", "ECE 153B", "CMPSC 181", "ECE 178"),
      true
    );
  });

  test("ECE 123 can replace ECE 122A in the VLSI sequence", () => {
    assert.equal(
      sequencesMet("ECE 123", "ECE 122B", "ECE 130A", "ECE 130B"),
      true
    );
  });

  test("Multimedia needs two of ECE 178, 180 and 181", () => {
    assert.equal(
      sequencesMet("ECE 178", "ECE 160", "CMPSC 160", "CMPSC 162"),
      false
    );
    assert.equal(
      sequencesMet("ECE 178", "ECE 180", "CMPSC 160", "CMPSC 162"),
      true
    );
  });

  test("a course counts toward one sequence only", () => {
    // Distributed Systems and Systems Software both need CMPSC 171.
    assert.equal(sequencesMet("CMPSC 171", "CMPSC 176A", "CMPSC 170"), false);
    // Networks (176A + 176B) and Systems Software (170 + 171) share nothing.
    assert.equal(
      sequencesMet("CMPSC 176A", "CMPSC 176B", "CMPSC 170", "CMPSC 171"),
      true
    );
    // Networks and Distributed Systems need four separate courses.
    assert.equal(sequencesMet("CMPSC 176A", "CMPSC 176B", "CMPSC 171"), false);
    assert.equal(
      sequencesMet("CMPSC 176A", "CMPSC 176B", "CMPSC 176C", "CMPSC 171"),
      true
    );
  });

  test("with the CMPSC capstone, 36 elective units are not enough", () => {
    const r = byName(
      run(UCSB_COMPUTER_ENGINEERING_BTLL, [
        ...courses("CMPSC 189A", "CMPSC 189B"),
        ...nineElectives,
      ])
    );
    assert.equal(r.get("Capstone: CMPSC 189A-B or ECE 189A-B-C"), true);
    assert.equal(r.get("Elective Units: 40 or 36 with ECE 189A-B-C"), false);
  });

  test("ECE 194R does not count as an elective", () => {
    const r = byName(
      run(UCSB_COMPUTER_ENGINEERING_BTLL, [
        ...eceCapstone,
        ...nineElectives.slice(0, 8),
        course("ECE 194R"),
      ])
    );
    assert.equal(r.get("Elective Units: 40 or 36 with ECE 189A-B-C"), false);
  });
});

describe("Electrical Engineering 2026-27", () => {
  const preparation = [
    ...courses(
      "CHEM 2A",
      "CMPSC 16",
      "ECE 3",
      "ECE 5",
      "ECE 10A",
      "ECE 10B",
      "ECE 10C",
      "ECE 15A",
      "ECE 130A",
      "ECE 130B",
      "ECE 139",
      "MATH 3A",
      "MATH 3B",
      "MATH 4A",
      "MATH 4B",
      "MATH 6A",
      "MATH 6B",
      "PHYS 7A",
      "PHYS 7B",
      "PHYS 7C",
      "PHYS 7D"
    ),
    ...["ECE 10AL", "ECE 10BL", "ECE 10CL", "PHYS 7L"].map((name) =>
      course(name, [], 1)
    ),
  ];
  const upperDivision = courses(
    "ECE 134",
    "ECE 152A",
    "ECE 188A",
    "ECE 188B",
    "ECE 188C",
    "ENGR 101",
    "ECE 153A"
  );
  const eightElectives = courses(
    "ECE 120A",
    "ECE 120B",
    "ECE 122A",
    "ECE 122B",
    "ECE 123",
    "ECE 125",
    "ECE 130C",
    "ECE 132"
  );

  test("a complete plan meets everything but the hand-checked depth sequence", () => {
    const results = run(
      UCSB_ELECTRICAL_ENGINEERING_BTLL,
      [
        ...preparation,
        ...upperDivision,
        ...eightElectives,
        ...courses("ECE 160"),
      ],
      60
    );
    assert.deepEqual(summary(results), [
      ["Preparation for the Major", true],
      ["Upper-Division Required Courses", true],
      ["Departmental Electives", false],
      ["Minimum 189 Units for Electrical Engineering", true],
    ]);
    assert.equal(
      byName(results).get("36 Units of Departmental Electives"),
      true
    );
  });

  test("with both ECE 153A and 153B, the second counts as an elective", () => {
    const withBoth = byName(
      run(UCSB_ELECTRICAL_ENGINEERING_BTLL, [
        ...eightElectives,
        ...courses("ECE 153A", "ECE 153B"),
      ])
    );
    assert.equal(withBoth.get("ECE 153A or 153B"), true);
    assert.equal(withBoth.get("36 Units of Departmental Electives"), true);

    const withOne = byName(
      run(UCSB_ELECTRICAL_ENGINEERING_BTLL, [
        ...eightElectives,
        ...courses("ECE 153A"),
      ])
    );
    assert.equal(withOne.get("36 Units of Departmental Electives"), false);
  });

  test("only one TMP course and one of MATRL 100B/101 count", () => {
    const r = byName(
      run(UCSB_ELECTRICAL_ENGINEERING_BTLL, [
        ...eightElectives.slice(0, 7),
        ...courses("TMP 120", "TMP 122", "MATRL 100B", "MATRL 101"),
      ])
    );
    // 28 + 4 (TMP) + 4 (MATRL) = 36; the second of each pair adds nothing.
    assert.equal(r.get("36 Units of Departmental Electives"), true);
    const short = byName(
      run(UCSB_ELECTRICAL_ENGINEERING_BTLL, [
        ...eightElectives.slice(0, 6),
        ...courses("TMP 120", "TMP 122", "MATRL 100B", "MATRL 101"),
      ])
    );
    assert.equal(short.get("36 Units of Departmental Electives"), false);
  });
});

describe("Mechanical Engineering 2026-27", () => {
  const preparation = [
    ...courses(
      "CHEM 2A",
      "CHEM 2AC",
      "CHEM 2B",
      "ENGR 3",
      "MATH 3A",
      "MATH 3B",
      "MATH 4A",
      "MATH 4B",
      "MATH 6A",
      "MATH 6B",
      "ME 6",
      "ME 10",
      "ME 14",
      "ME 15",
      "ME 16",
      "ME 17",
      "PHYS 7A",
      "PHYS 7B",
      "PHYS 7C",
      "PHYS 7D",
      "PHYS 7L"
    ),
    course("ME 12S", [], 1),
  ];
  const thirdYear = courses(
    "MATRL 101",
    "ME 103",
    "ME 104",
    "ME 107",
    "ME 108",
    "ME 151A",
    "ME 151B",
    "ME 152A",
    "ME 153",
    "ME 141A",
    "ME 141B"
  );
  const fourthYear = courses(
    "ME 105",
    "ME 156A",
    "ME 156B",
    "ME 189A",
    "ME 189B",
    "ME 189C",
    "ME 157",
    "ME 110",
    "ME 112",
    "ME 125EM"
  );

  test("a complete plan meets every requirement", () => {
    const results = run(UCSB_MECHANICAL_ENGINEERING_BTLL, [
      ...preparation,
      ...thirdYear,
      ...fourthYear,
    ]);
    assert.deepEqual(summary(results), [
      ["Preparation for the Major", true],
      ["Third Year", true],
      ["Fourth Year", true],
    ]);
  });

  test("ME 154 covers the specialization when it is the only L2 course", () => {
    const r = byName(
      run(
        UCSB_MECHANICAL_ENGINEERING_BTLL,
        courses("ME 166", "ME 154", "MEW 167")
      )
    );
    assert.equal(
      r.get("Specialization (one group, or one L1 and one L2 course)"),
      true
    );
    assert.equal(r.get("ME 154 or 157 or 167"), true);
  });

  test("ME 154 alone cannot cover both the specialization and ME 154/157/167", () => {
    const r = byName(
      run(UCSB_MECHANICAL_ENGINEERING_BTLL, courses("ME 166", "ME 154"))
    );
    assert.equal(r.get("ME 154 or 157 or 167"), false);
  });

  test("specialization and ME 157 do not also count as electives", () => {
    const r = byName(
      run(
        UCSB_MECHANICAL_ENGINEERING_BTLL,
        courses("ME 141A", "ME 141B", "ME 157", "ME 110", "ME 112")
      )
    );
    // Only ME 110 and 112 (8 units) count toward the 9.
    assert.equal(r.get("9 Units of Engineering Electives"), false);
  });
});
