import {
  allOf,
  and,
  cappedUnits,
  electiveCourses,
  firstCoursesUnits,
  or,
  program,
  someOf,
} from "./builders";

/**
 * Mechanical Engineering (College of Engineering), B.S., from the 2026-27
 * GEAR, page 24.
 *
 * - Specialization: two courses, either a group or one from L1 and one from
 *   L2. A group is itself one L1 and one L2 course, so the rule checked is
 *   one course from each row.
 * - ME 154, 157 or 167 (MEW 167 is the online 167): the course used here
 *   does not also count as an engineering elective, and neither do the
 *   specialization courses. ME 154 is used for the specialization only when
 *   no other L2 course is planned.
 * - Engineering electives: 9 units. ME 197 and 199 count for at most 4 units
 *   combined, and only one TMP course counts. "ME 125AA-ZZ" is matched as any
 *   ME 125 with a letter suffix.
 * - Only one of MATRL 101 and MATRL 100C counts toward the major.
 *
 * Not checked: letter grades and faculty-adviser approval of electives.
 * Keep the order of the returned requirements: plans store manual check-offs
 * by position.
 */
const ELECTIVES = [
  "BIOE 120A",
  "BIOE 120B",
  "CHEM 109A",
  "CHEM 123",
  "ECE 147A",
  "ECE 147C",
  "CMPSC 181B",
  "ECE 181B",
  "ENGR 101",
  "ENGR 195A",
  "ENGR 195B",
  "ENGR 195C",
  "ENVS 105",
  "MATRL 100A",
  "MATRL 100B",
  "MATRL 186A",
  "MATRL 186B",
  "ME 102",
  "ME 110",
  "ME 112",
  "ME 123",
  "ME 124",
  "ME 126",
  "ME 127",
  "ME 128",
  "ME 129",
  "ME 133",
  "ME 134",
  "ME 135",
  "ME 140A",
  "ME 140B",
  "ME 141A",
  "ME 141B",
  "ME 146",
  "ME 147",
  "ME 154",
  "ME 155B",
  "ME 155C",
  "ME 157",
  "ME 158",
  "ME 159",
  "ME 162",
  "ME 166",
  "ME 167",
  "MEW 167",
  "ME 169",
  "ME 179D",
  "ME 179L",
  "ME 179P",
  "ME 180",
  "ME 185",
  "ME 186A",
  "ME 186B",
];

export const UCSB_MECHANICAL_ENGINEERING_BTLL = program(
  `
  // Preparation for the major
  ${allOf("chem_1", ["CHEM 1A", "CHEM 2AL", "CHEM 1B"], "CHEM 1A, 2AL and 1B")}
  ${allOf("chem_2", ["CHEM 2A", "CHEM 2AC", "CHEM 2B"], "CHEM 2A, 2AC and 2B")}
  ${or("chemistry", ["chem_1", "chem_2"], "Chemistry: CHEM 1A, 2AL, 1B or 2A, 2AC, 2B")}
  ${allOf("math", ["MATH 3A", "MATH 3B", "MATH 4A", "MATH 4B", "MATH 6A", "MATH 6B"], "Mathematics")}
  ${allOf(
    "me_prep",
    ["ENGR 3", "ME 6", "ME 10", "ME 12S", "ME 14", "ME 15", "ME 16", "ME 17"],
    "Engineering"
  )}
  ${allOf("physics", ["PHYS 7A", "PHYS 7B", "PHYS 7C", "PHYS 7D", "PHYS 7L"], "Physics")}
  ${and("preparation", ["chemistry", "math", "me_prep", "physics"], "Preparation for the Major")}

  // Third year
  ${someOf("materials", ["MATRL 101", "MATRL 100C"], "MATRL 101 or MATRL 100C")}
  ${allOf(
    "third_year_core",
    [
      "ME 103",
      "ME 104",
      "ME 107",
      "ME 108",
      "ME 151A",
      "ME 151B",
      "ME 152A",
      "ME 153",
    ],
    "Required Courses"
  )}
  List<Course> l1_list [{"BIOE 120A"}, {"ME 163"}, {"ME 127"}, {"ME 141A"}, {"ME 166"}, {"ME 152B"}]
  List<Course> l2_list [{"BIOE 120B"}, {"ME 155A"}, {"ME 129"}, {"ME 141B"}, {"ME 154"}, {"ME 151C"}]
  List<Course> l1_matches filter(courses, (c) {
    boolean return one_common_course([c], l1_list)
  })
  List<Course> l2_matches filter(courses, (c) {
    boolean return one_common_course([c], l2_list)
  })
  List<Course> l2_preferred filter(l2_matches, (c) {
    boolean return not(one_common_course([c], [{"ME 154"}]))
  })
  List<Course> l1_used slice(l1_matches, 0, 1)
  List<Course> l2_used if_else(greater_than(length(l2_preferred), 0), slice(l2_preferred, 0, 1), slice(l2_matches, 0, 1))
  NCoursesRequirement l1 {l1_matches, 1, "One L1 course: BIO E 120A or ME 163, 127, 141A, 166, 152B"}
  NCoursesRequirement l2 {l2_matches, 1, "One L2 course: BIO E 120B or ME 155A, 129, 141B, 154, 151C"}
  ${and("specialization", ["l1", "l2"], "Specialization (one group, or one L1 and one L2 course)")}
  ${and("third_year", ["materials", "third_year_core", "specialization"], "Third Year")}

  // Fourth year
  ${allOf("fourth_year_core", ["ME 105", "ME 156A", "ME 156B", "ME 189A", "ME 189B", "ME 189C"], "Required Courses")}
  List<Course> design_list [{"ME 154"}, {"ME 157"}, {"ME 167"}, {"MEW 167"}]
  List<Course> design_pool filter(courses, (c) {
    boolean on_list one_common_course([c], design_list)
    boolean used_l2 one_common_course([c], l2_used)
    boolean return and([on_list, not(used_l2)])
  })
  List<Course> design_used slice(design_pool, 0, 1)
  NCoursesRequirement design {design_pool, length(design_used), 1, "ME 154 or 157 or 167"}

  ${electiveCourses("listed_electives", ELECTIVES, { subject: "ME", number: "^125[A-Z][A-Z]?$" })}
  List<Course> elective_pool filter(listed_electives, (c) {
    boolean used_l1 one_common_course([c], l1_used)
    boolean used_l2 one_common_course([c], l2_used)
    boolean used_design one_common_course([c], design_used)
    boolean return not(or([used_l1, used_l2, used_design]))
  })
  ${cappedUnits("independent", ["ME 197", "ME 199"], 4)}
  ${firstCoursesUnits("tmp", ["TMP 120", "TMP 122"], 1)}
  number elective_units add([sum_units(elective_pool), independent_units, tmp_units])
  NumberRequirement electives {elective_units, 9, "9 Units of Engineering Electives"}
  ${and("fourth_year", ["fourth_year_core", "design", "electives"], "Fourth Year")}
`,
  ["preparation", "third_year", "fourth_year"]
);
