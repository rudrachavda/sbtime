import {
  allOf,
  and,
  cappedUnits,
  electiveCourses,
  or,
  program,
  someOf,
  totalUnits,
} from "./builders";

/**
 * Chemical Engineering (College of Engineering), B.S., from the 2026-27
 * GEAR, page 16.
 *
 * - Technical electives: 15 units from the approved list, at least 9 of them
 *   in CH E, ECE, MATRL or ME. CH E 196 and 198 together count for at most
 *   3 units. The undergraduate adviser must approve them first, which is
 *   left to the student.
 * - Only one of MATRL 101 and MATRL 100C counts toward the major.
 * - 187 units are required to graduate.
 *
 * Not checked: letter grades and the GPA rule on CH E 196/198.
 * Keep the order of the returned requirements: plans store manual check-offs
 * by position.
 */
const DEPARTMENT_ELECTIVES = [
  "CHE 102",
  "CHE 121",
  "CHE 124",
  "CHE 125",
  "CHE 126",
  "CHE 141",
  "CHE 146",
  "CHE 152B",
  "CHE 154",
  "CHE 160",
  "CHE 166",
  "CHE 171",
  "CHE 173",
  "CHE 174",
  "ECE 130A",
  "ECE 130B",
  "ECE 130C",
  "ECE 183",
  "MATRL 100A",
  "MATRL 100B",
  "MATRL 135",
  "MATRL 160",
  "MATRL 185",
  "ME 110",
  "ME 112",
  "ME 128",
  "ME 134",
  "ME 169",
  "ME 185",
];

const OTHER_ELECTIVES = [
  "CHEM 109C",
  "CHEM 115A",
  "CHEM 115B",
  "CHEM 115C",
  "CHEM 123",
  "CHEM 126",
  "CHEM 142A",
  "CHEM 142B",
  "CHEM 142C",
  "CHEM 145",
  "CHEM 147",
  "CHEM 150",
  "ENGR 101",
  "ENGR 103",
  "ENVS 105",
  "MATH 122A",
  "MATH 122B",
  "MCDB 101A",
  "MCDB 101B",
  "MCDB 111",
  "MCDB 126A",
  "MCDB 126B",
  "MCDB 126C",
  "MCDB 133",
  "MCDB 138",
  "PHYS 123A",
  "PHYS 123B",
  "PHYS 127AL",
  "PHYS 127BL",
];

export const UCSB_CHEMICAL_ENGINEERING_BTLL = program(
  `
  // Preparation for the major
  ${allOf("che_prep", ["CHE 5", "CHE 10", "ENGR 3"], "Chemical Engineering and Engineering")}
  ${allOf("chem_3", ["CHEM 3A", "CHEM 3B", "CHEM 3C"], "CHEM 3A-B-C")}
  ${allOf("chem_1", ["CHEM 1A", "CHEM 1B", "CHEM 1C"], "CHEM 1A-B-C")}
  ${or("general_chem", ["chem_3", "chem_1"], "General Chemistry: CHEM 3A-B-C or 1A-B-C")}
  ${allOf("chem_labs", ["CHEM 2AL", "CHEM 2BL", "CHEM 6AL", "CHEM 6BL"], "Chemistry Laboratories")}
  ${someOf("organic_a", ["CHEM 109A", "CHEM 130A"], "CHEM 109A or 130A")}
  ${someOf("organic_b", ["CHEM 109B", "CHEM 130B"], "CHEM 109B or 130B")}
  ${allOf("math_core", ["MATH 3A", "MATH 3B", "MATH 6B"], "MATH 3A-B and 6B")}
  ${someOf("math_4a", ["MATH 4A", "MATH 4AI"], "MATH 4A or 4AI")}
  ${someOf("math_4b", ["MATH 4B", "MATH 4BI"], "MATH 4B or 4BI")}
  ${someOf("math_6a", ["MATH 6A", "MATH 6AI"], "MATH 6A or 6AI")}
  ${allOf("physics", ["PHYS 7A", "PHYS 7B", "PHYS 7C", "PHYS 7L"], "Physics")}
  ${and(
    "preparation",
    [
      "che_prep",
      "general_chem",
      "chem_labs",
      "organic_a",
      "organic_b",
      "math_core",
      "math_4a",
      "math_4b",
      "math_6a",
      "physics",
    ],
    "Preparation for the Major"
  )}

  // Upper-division required courses
  ${allOf(
    "upper_div_core",
    [
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
    ],
    "Required Courses"
  )}
  ${someOf("materials", ["MATRL 101", "MATRL 100C"], "MATRL 101 or MATRL 100C")}
  ${and("upper_div", ["upper_div_core", "materials"], "Upper-Division Required Courses")}

  // Technical electives: 15 units, at least 9 in CH E, ECE, MATRL or ME
  ${electiveCourses("department_electives", DEPARTMENT_ELECTIVES)}
  ${electiveCourses("other_electives", OTHER_ELECTIVES)}
  ${cappedUnits("independent", ["CHE 196", "CHE 198"], 3)}
  number department_units add([sum_units(department_electives), independent_units])
  number elective_units add([department_units, sum_units(other_electives)])
  NumberRequirement elective_units_req {elective_units, 15, "15 Units of Technical Electives"}
  NumberRequirement department_units_req {department_units, 9, "9 of Them in CH E, ECE, MATRL or ME"}
  ${and("electives", ["elective_units_req", "department_units_req"], "Technical Electives")}

  ${totalUnits("graduation_units", 187, "Chemical Engineering")}
`,
  ["preparation", "upper_div", "electives", "graduation_units"]
);
