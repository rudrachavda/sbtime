import { planned } from "./builders";

/**
 * Science electives for Computer Science and Artificial Intelligence, from
 * the CS Department's BS Degree page
 * (https://cs.ucsb.edu/education/undergraduate/current-students), effective
 * for catalog year 2023-24. The AI major's own page asks for the same
 * 20 units; it lists no separate courses, so it shares CS's lists.
 *
 * - List A: 8 units.
 * - List B: 12 units, including at least one lab.
 * - A course on both lists counts toward only one of them. Shared courses
 *   are placed wherever they are needed: the lists are met when List A plus
 *   the shared courses reach 8 units, List B plus the shared courses reach
 *   12, and everything together reaches 20.
 * - "PHYS 4 + 4L", "PHYS 5 + 5L" and "MCDB 1B and EEMB 2, plus MCDB 1LL or
 *   EEMB 2L" count for List A only when the whole group is planned. MCDB 1B
 *   and 1LL used in that group no longer count for List B.
 * - The AP Biology exam (score of 3 or higher: 8 units of List A) is ticked
 *   off by hand.
 *
 * Not checked: letter grades. Units are pooled, so a plan whose shared
 * courses can't be split exactly (e.g. one 5-unit course needed by both
 * lists) may show as met slightly early.
 *
 * TODO: keep this in step with the sources. As of November 2026:
 * - The CS page still shows the 2023-24 lists, while the rest of GradTrak
 *   follows the 2026-27 GEAR. When the department posts a newer list,
 *   update the lists below.
 * - The AI major (new; https://ai.cs.ucsb.edu/curriculum) has no list of
 *   its own and is assumed to share CS's. If it gets its own, give
 *   artificial-intelligence.ts separate lists instead of this helper.
 */
const LIST_A = [
  "ANTH 5",
  "ASTRO 1",
  "ASTRO 2",
  "EARTH 2",
  "EARTH 4",
  "EARTHW 4",
  "EARTH 6",
  "EARTH 7",
  "EARTH 8",
  "EARTH 9",
  "EARTH 10",
  "EARTH 20",
  "EARTHW 20",
  "EARTH 30",
  "EARTH 111",
  "EARTH 123",
  "EARTH 130",
  "ECON 1",
  "ECON 2",
  "EEMB 21",
  "EEMB 22",
  "EEMB 40",
  "EEMB 50",
  "ENVS 2",
  "GEOG 3",
  "GEOG 4",
  "GEOG 8",
  "GEOG 12",
  "GEOGW 12",
  "GEOG 115A",
  "GEOG 115B",
  "MCDB 20",
  "MCDB 21",
  "MCDB 23",
  "MCDB 26",
  "MCDB 29",
  "PSY 108",
];

/** On both lists. */
const SHARED = [
  "CHEM 1A",
  "CHEM 1B",
  "CHEM 1C",
  "CHEM 2AL",
  "CHEM 2BL",
  "MCDB 1A",
];

/** List B only (MCDB 1B and 1LL are handled with the biology group). */
const LIST_B = [
  "PHYS 1",
  "PHYS 2",
  "PHYS 3",
  "PHYS 3L",
  "PHYS 6A",
  "PHYS 6AL",
  "PHYS 6B",
  "PHYS 6BL",
  "PHYS 6C",
  "PHYS 6CL",
  "PHYS 7A",
  "PHYS 7B",
  "PHYS 7C",
  "PHYS 7D",
  "PHYS 7L",
];

/** List B labs other than MCDB 1LL. */
const LIST_B_LABS = [
  "PHYS 3L",
  "PHYS 6AL",
  "PHYS 6BL",
  "PHYS 6CL",
  "PHYS 7L",
  "CHEM 2AL",
  "CHEM 2BL",
];

/** Units of a group that only counts when every course in it is planned. */
const wholeGroup = (id: string, courses: string[]) => `
  ${planned(id, courses)}
  number ${id}_units if_else(greater_than(length(${id}_matches), ${courses.length - 1}), sum_units(${id}_matches), 0)`;

/** Declares the requirement `${id}`: both science elective lists. */
export const scienceElectives = (id: string) => `
  ${planned("sci_a", LIST_A)}
  ${wholeGroup("sci_phys_4", ["PHYS 4", "PHYS 4L"])}
  ${wholeGroup("sci_phys_5", ["PHYS 5", "PHYS 5L"])}
  ${planned("sci_mcdb_1b", ["MCDB 1B"])}
  ${planned("sci_eemb_2", ["EEMB 2"])}
  ${planned("sci_mcdb_1ll", ["MCDB 1LL"])}
  ${planned("sci_eemb_2l", ["EEMB 2L"])}
  ${planned("sci_bio", ["MCDB 1B", "EEMB 2", "MCDB 1LL", "EEMB 2L"])}
  boolean sci_bio_group and([sci_mcdb_1b, sci_eemb_2, or([sci_mcdb_1ll, sci_eemb_2l])])
  number sci_bio_units if_else(sci_bio_group, sum_units(sci_bio_matches), 0)
  number sci_a_units add([sum_units(sci_a_matches), sci_phys_4_units, sci_phys_5_units, sci_bio_units])

  ${planned("sci_shared", SHARED)}
  number sci_shared_units sum_units(sci_shared_matches)

  ${planned("sci_b", LIST_B)}
  ${planned("sci_b_bio", ["MCDB 1B", "MCDB 1LL"])}
  number sci_b_units add([sum_units(sci_b_matches), if_else(sci_bio_group, 0, sum_units(sci_b_bio_matches))])
  ${planned("sci_b_lab_main", LIST_B_LABS)}
  boolean sci_b_has_lab or([sci_b_lab_main, and([sci_mcdb_1ll, not(sci_bio_group)])])

  NumberRequirement sci_a_req {add([sci_a_units, sci_shared_units]), 8, "List A: 8 units"}
  NumberRequirement sci_total_req {add([sci_a_units, sci_b_units, sci_shared_units]), 20, "20 units across both lists, each course counted once"}
  AndRequirement sci_a_courses {[sci_a_req, sci_total_req], "List A from courses"}
  BooleanRequirement sci_ap_biology {false, "AP Biology exam, score of 3 or higher (8 units of List A)"}
  OrRequirement sci_list_a {[sci_a_courses, sci_ap_biology], "Science Electives List A"}
  NumberRequirement sci_b_req {add([sci_b_units, sci_shared_units]), 12, "List B: 12 units"}
  BooleanRequirement sci_b_lab_req {sci_b_has_lab, "List B: at least one lab"}
  AndRequirement sci_list_b {[sci_b_req, sci_b_lab_req], "Science Electives List B"}
  AndRequirement ${id} {[sci_list_a, sci_list_b], "Science Electives: List A (8 units) and List B (12 units)"}`;
