import {
  allOf,
  and,
  cappedUnits,
  electiveCourses,
  or,
  planned,
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
 *   Department. The 12 sequences come from the department's "Senior
 *   Elective Sequence (choose 2)" sheet (the GEAR does not list them). The
 *   sheet doesn't say whether a course can count in two sequences; this
 *   assumes it can't.
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
  // Senior elective sequences (ECE Department sheet): at least 2.
  ${planned("has_176a", ["CMPSC 176A"])}
  ${planned("has_176b", ["CMPSC 176B"])}
  ${planned("has_176c", ["CMPSC 176C"])}
  ${planned("has_171", ["CMPSC 171"])}
  ${planned("has_170", ["CMPSC 170"])}
  ${planned("has_153a", ["ECE 153A", "CMPSC 153A"])}
  ${planned("has_153b", ["ECE 153B"])}
  ${planned("has_178", ["ECE 178"])}
  ${planned("has_180", ["ECE 180"])}
  ${planned("has_181", ["ECE 181", "CMPSC 181"])}
  ${planned("has_160", ["CMPSC 160"])}
  ${planned("has_162", ["CMPSC 162"])}
  ${planned("has_147a", ["ECE 147A"])}
  ${planned("has_147b", ["ECE 147B"])}
  ${planned("has_vlsi_a", ["ECE 122A", "ECE 123"])}
  ${planned("has_122b", ["ECE 122B"])}
  ${planned("has_179d", ["ECE 179D"])}
  ${planned("has_179p", ["ECE 179P"])}
  ${planned("has_130a", ["ECE 130A"])}
  ${planned("has_130b", ["ECE 130B"])}
  ${planned("has_157a", ["ECE 157A"])}
  ${planned("has_157b", ["ECE 157B"])}
  ${planned("has_165a", ["CMPSC 165A"])}
  ${planned("has_165b", ["CMPSC 165B"])}

  number multimedia_count add([if_else(has_178, 1, 0), if_else(has_180, 1, 0), if_else(has_181, 1, 0)])
  boolean systems_design and([has_153a, has_153b])
  boolean multimedia greater_than(multimedia_count, 1)
  boolean programming_languages and([has_160, has_162])
  boolean real_time and([has_147a, has_147b])
  boolean vlsi and([has_vlsi_a, has_122b])
  boolean robotics and([has_179d, has_179p])
  boolean signals and([has_130a, has_130b])
  boolean design_automation and([has_157a, has_157b])
  boolean machine_learning and([has_165a, has_165b])
  number independent_sequences add([if_else(systems_design, 1, 0), if_else(multimedia, 1, 0), if_else(programming_languages, 1, 0), if_else(real_time, 1, 0), if_else(vlsi, 1, 0), if_else(robotics, 1, 0), if_else(signals, 1, 0), if_else(design_automation, 1, 0), if_else(machine_learning, 1, 0)])

  // Networks, Distributed Systems and Systems Software share courses, and a
  // course counts toward one sequence only. Distributed Systems and Systems
  // Software both need CMPSC 171, so they never pair; Networks and
  // Distributed Systems pair only with CMPSC 171, 176A, 176B and 176C.
  boolean networks and([has_176a, or([has_176b, has_176c])])
  boolean distributed and([has_171, or([has_176a, has_176b])])
  boolean systems_software and([has_170, has_171])
  boolean networks_and_distributed and([has_176a, has_176b, has_176c, has_171])
  boolean two_shared or([and([networks, systems_software]), networks_and_distributed])
  number shared_sequences if_else(two_shared, 2, if_else(or([networks, distributed, systems_software]), 1, 0))

  number sequence_count add([independent_sequences, shared_sequences])
  BooleanRequirement sequences {greater_than(sequence_count, 1), "At least 2 approved elective sequences (ECE Department list)"}
  ${and("electives", ["elective_units_req", "sequences"], "Computer Engineering Electives")}

  ${totalUnits("graduation_units", 191, "Computer Engineering")}
`,
  ["preparation", "upper_div", "electives", "graduation_units"]
);
