import {
  allOf,
  and,
  byHand,
  cappedUnits,
  electiveCourses,
  or,
  program,
  totalUnits,
} from "./builders";

/**
 * Computer Engineering (College of Engineering), B.S., from the 2026-27
 * GEAR, page 18.
 *
 * - Capstone: CMPSC 189A-B (8 units) or ECE 189A-B-C (12 units). Electives
 *   are 36-40 units: 40 with the CMPSC capstone, 36 with the ECE one, so the
 *   two always add up to 48.
 * - Electives must include at least 2 sequences approved by the ECE
 *   Department; the list is not in the GEAR, so this is checked off by hand.
 * - ECE 192/196 and CMPSC 192/196 count for at most 4 units combined (the
 *   GEAR's text is cut off after "(4 units"). "ECE 194AA-194ZZ (except
 *   194R)" is matched as any ECE 194 with a letter suffix other than R.
 * - 191 units are required to graduate.
 *
 * Not checked: letter grades and faculty-adviser approval of electives.
 * Keep the order of the returned requirements: plans store manual check-offs
 * by position.
 */
const ELECTIVES = [
  "CMPSC 130B",
  "CMPSC 138",
  "CMPSC 153A",
  "ECE 153A",
  "CMPSC 156",
  "CMPSC 160",
  "CMPSC 162",
  "CMPSC 165A",
  "CMPSC 165B",
  "CMPSC 170",
  "CMPSC 171",
  "CMPSC 174A",
  "CMPSC 176A",
  "CMPSC 176B",
  "CMPSC 176C",
  "CMPSC 177",
  "CMPSC 178",
  "CMPSC 181",
  "ECE 181",
  "ECE 122A",
  "ECE 122B",
  "ECE 123",
  "ECE 130A",
  "ECE 130B",
  "ECE 130C",
  "ECE 133",
  "ECE 147A",
  "ECE 147B",
  "ECE 148",
  "ECE 149",
  "ECE 150",
  "ECE 152B",
  "ECE 153B",
  "ECE 154B",
  "ECE 157A",
  "ECE 157B",
  "ECE 157C",
  "ECE 160",
  "ECE 178",
  "ECE 179D",
  "ECE 179P",
  "ECE 180",
  "ECE 184",
  "ECE 186",
];

export const UCSB_COMPUTER_ENGINEERING_BTLL = program(
  `
  // Preparation for the major
  ${allOf("cmpsc_prep", ["CMPSC 16", "CMPSC 24", "CMPSC 32", "CMPSC 41"], "Computer Science")}
  ${allOf(
    "ece_prep",
    [
      "ECE 1A",
      "ECE 1B",
      "ECE 5",
      "ECE 10A",
      "ECE 10AL",
      "ECE 10B",
      "ECE 10BL",
      "ECE 10C",
      "ECE 10CL",
      "ECE 15A",
    ],
    "Electrical and Computer Engineering"
  )}
  ${allOf("math_2", ["MATH 2A", "MATH 2B"], "MATH 2A-B")}
  ${allOf("math_3", ["MATH 3A", "MATH 3B"], "MATH 3A-B")}
  ${or("calculus", ["math_2", "math_3"], "Calculus: MATH 2A-B or 3A-B")}
  ${allOf("math_rest", ["MATH 4A", "MATH 4B", "MATH 6A"], "MATH 4A-B and 6A")}
  ${allOf("physics", ["PHYS 7A", "PHYS 7B", "PHYS 7C", "PHYS 7D", "PHYS 7L"], "Physics")}
  ${and("preparation", ["cmpsc_prep", "ece_prep", "calculus", "math_rest", "physics"], "Preparation for the Major")}

  // Upper-division required courses
  ${allOf("upper_div_core", ["CMPSC 130A", "ECE 139", "ECE 152A", "ECE 154A", "ENGR 101"], "Required Courses")}
  ${allOf("cmpsc_capstone", ["CMPSC 189A", "CMPSC 189B"], "CMPSC 189A-B")}
  ${allOf("ece_capstone", ["ECE 189A", "ECE 189B", "ECE 189C"], "ECE 189A-B-C")}
  ${or("capstone", ["cmpsc_capstone", "ece_capstone"], "Capstone: CMPSC 189A-B or ECE 189A-B-C")}
  ${and("upper_div", ["upper_div_core", "capstone"], "Upper-Division Required Courses")}

  // Computer Engineering electives: 40 units, or 36 with the ECE capstone
  ${electiveCourses("listed_electives", ELECTIVES, { subject: "ECE", number: "^194([A-QS-Z]|[A-Z][A-Z])$" })}
  ${cappedUnits("independent", ["ECE 192", "ECE 196", "CMPSC 192", "CMPSC 196"], 4)}
  number elective_units add([sum_units(listed_electives), independent_units])
  boolean has_ece_capstone get_attr(ece_capstone, "result")
  number required_elective_units if_else(has_ece_capstone, 36, 40)
  NumberRequirement elective_units_req {elective_units, required_elective_units, "Elective Units: 40 or 36 with ECE 189A-B-C"}
  ${byHand("sequences", "At least 2 elective sequences approved by the ECE Department")}
  ${and("electives", ["elective_units_req", "sequences"], "Computer Engineering Electives")}

  ${totalUnits("graduation_units", 191, "Computer Engineering")}
`,
  ["preparation", "upper_div", "electives", "graduation_units"]
);
