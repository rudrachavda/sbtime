import {
  allOf,
  and,
  byHand,
  cappedUnits,
  electiveCourses,
  program,
  someOf,
} from "./builders";

/**
 * Artificial Intelligence (College of Engineering), B.S., from the 2026-27
 * GEAR, page 14.
 *
 * - Major field electives: 9 courses from the list. CMPSC 192 and 196
 *   together count for at most 4 units (one course). "CMPSC 190AA-ZZ" is
 *   matched as any CMPSC 190 with a letter suffix; "CMPSC/ECE 153A" and
 *   "C LIT/GER 155" count under either subject.
 * - Science electives (List A, 8 units; List B, 12 units) are checked off by
 *   hand until the department's lists are added.
 *
 * Not checked: letter grades and the GPA rule on CMPSC 192/196.
 * Keep the order of the returned requirements: plans store manual check-offs
 * by position.
 */
export const UCSB_ARTIFICIAL_INTELLIGENCE_BTLL = program(
  `
  // Preparation for the major
  ${allOf("cmpsc_prep", ["CMPSC 1A", "CMPSC 9", "CMPSC 25", "CMPSC 41", "CMPSC 42"], "Computer Science")}
  ${allOf("math_prep", ["MATH 3A", "MATH 3B", "MATH 4A", "MATH 4B", "MATH 6A", "ECE 139"], "Mathematics and Probability")}
  ${and("preparation", ["cmpsc_prep", "math_prep"], "Preparation for the Major")}

  // Upper-division required courses
  ${allOf("upper_div_core", ["CMPSC 130A", "CMPSC 130B", "CMPSC 135", "CMPSC 165A", "CMPSC 165B", "CMPSC 183", "CMPSC 187", "CMPSC 188"], "Required Courses")}
  ${someOf("vision", ["CMPSC 181", "ECE 181"], "CMPSC 181 or ECE 181")}
  ${and("upper_div", ["upper_div_core", "vision"], "Upper-Division Required Courses")}

  // Major field electives: 9 courses
  ${electiveCourses(
    "listed_electives",
    [
      "CMPSC 110",
      "CMPSC 111",
      "CMPSC 132",
      "CMPSC 134",
      "CMPSC 138",
      "CMPSC 140",
      "CMPSC 148",
      "CMPSC 153A",
      "ECE 153A",
      "CMPSC 154",
      "CMPSC 156",
      "CMPSC 160",
      "CMPSC 162",
      "CMPSC 170",
      "CMPSC 171",
      "CMPSC 172",
      "CMPSC 174A",
      "CMPSC 174B",
      "CMPSC 176A",
      "CMPSC 176B",
      "CMPSC 176C",
      "CMPSC 177",
      "CMPSC 178",
      "CMPSC 180",
      "CMPSC 184",
      "CMPSC 185",
      "CMPSC 186",
      "CMPSC 189C",
      "CMPSC 189D",
      "ECE 180",
      "ECE 186",
      "ENGL 197",
      "ENGL 146DS",
      "ENGL 146AI",
      "CLIT 155",
      "GER 155",
      "ME 107",
    ],
    { subject: "CMPSC", number: "^190[A-Z][A-Z]?$" }
  )}
  ${cappedUnits("independent", ["CMPSC 192", "CMPSC 196"], 4)}
  number independent_count if_else(greater_than(length(independent), 0), 1, 0)
  number elective_count add([length(listed_electives), independent_count])
  List<Course> all_electives filter(courses, (c) {
    boolean listed one_common_course([c], listed_electives)
    boolean independent_study one_common_course([c], independent)
    boolean return or([listed, independent_study])
  })
  NCoursesRequirement electives {all_electives, elective_count, 9, "9 Major Field Electives"}

  ${byHand("science_electives", "Science Electives: List A (8 units) and List B (12 units) from the department's lists")}
`,
  ["preparation", "upper_div", "electives", "science_electives"]
);
