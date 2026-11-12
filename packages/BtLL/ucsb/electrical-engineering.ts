import {
  allOf,
  and,
  byHand,
  cappedUnits,
  electiveCourses,
  firstCoursesUnits,
  or,
  program,
  someOf,
  totalUnits,
} from "./builders";

/**
 * Electrical Engineering (College of Engineering), B.S., from the 2026-27
 * GEAR, page 22.
 *
 * - Departmental electives: 36 units from the approved list, including a
 *   depth sequence in one track. The nine tracks come from the ECE
 *   Department's curriculum page for 2026-27
 *   (https://www.ece.ucsb.edu/undergrad/curriculum). A student's own track,
 *   approved by a faculty adviser, is checked off by hand.
 * - ECE 153A or 153B is required; if both are planned, the second counts as
 *   an elective.
 * - Elective caps: ECE 192 and 196 at most 4 units combined; MATRL 100B or
 *   MATRL 101, one of them; TMP 120 and 122, one course. "ECE 194AA-ZZ
 *   (excluding 194R)" is matched as any ECE 194 with a letter suffix other
 *   than R.
 * - 189 units are required to graduate.
 *
 * Not checked: letter grades and faculty-adviser approval of electives.
 * Keep the order of the returned requirements: plans store manual check-offs
 * by position.
 */
const ELECTIVES = [
  "ECE 120A",
  "ECE 120B",
  "ECE 122A",
  "ECE 122B",
  "ECE 123",
  "ECE 125",
  "ECE 130C",
  "ECE 132",
  "ECE 133",
  "ECE 135",
  "ECE 136A",
  "ECE 136B",
  "ECE 136C",
  "ECE 137A",
  "ECE 137B",
  "ECE 141A",
  "ECE 141B",
  "ECE 142",
  "ECE 144",
  "ECE 145A",
  "ECE 145B",
  "ECE 145C",
  "ECE 146A",
  "ECE 146B",
  "ECE 147A",
  "ECE 147B",
  "ECE 147C",
  "ECE 148",
  "ECE 149",
  "ECE 152B",
  "ECE 154A",
  "ECE 154B",
  "ECE 157A",
  "ECE 157B",
  "ECE 157C",
  "ECE 158",
  "ECE 160",
  "ECE 162A",
  "ECE 162B",
  "ECE 162C",
  "ECE 178",
  "ECE 179D",
  "ECE 179P",
  "ECE 180",
  "ECE 181",
  "ECE 183",
  "ECE 184",
  "ECE 186",
  "MATRL 100A",
  "MATRL 100C",
  "MATRL 162A",
  "MATRL 162B",
];

export const UCSB_ELECTRICAL_ENGINEERING_BTLL = program(
  `
  // Preparation for the major
  ${someOf("chemistry", ["CHEM 1A", "CHEM 2A", "ECE 6"], "CHEM 1A or 2A or ECE 6")}
  ${someOf("programming", ["CMPSC 9", "CMPSC 16"], "CMPSC 9 or CMPSC 16")}
  ${allOf(
    "ece_prep",
    [
      "ECE 3",
      "ECE 5",
      "ECE 10A",
      "ECE 10AL",
      "ECE 10B",
      "ECE 10BL",
      "ECE 10C",
      "ECE 10CL",
      "ECE 15A",
      "ECE 130A",
      "ECE 130B",
      "ECE 139",
    ],
    "Electrical and Computer Engineering"
  )}
  ${allOf("math_2", ["MATH 2A", "MATH 2B"], "MATH 2A-B")}
  ${allOf("math_3", ["MATH 3A", "MATH 3B"], "MATH 3A-B")}
  ${or("calculus", ["math_2", "math_3"], "Calculus: MATH 2A-B or 3A-B")}
  ${allOf("math_rest", ["MATH 4A", "MATH 4B", "MATH 6A", "MATH 6B"], "MATH 4A-B and 6A-B")}
  ${allOf("physics", ["PHYS 7A", "PHYS 7B", "PHYS 7C", "PHYS 7D", "PHYS 7L"], "Physics")}
  ${and(
    "preparation",
    [
      "chemistry",
      "programming",
      "ece_prep",
      "calculus",
      "math_rest",
      "physics",
    ],
    "Preparation for the Major"
  )}

  // Upper-division required courses
  ${allOf("upper_div_core", ["ECE 134", "ECE 152A", "ECE 188A", "ECE 188B", "ECE 188C", "ENGR 101"], "Required Courses")}
  ${someOf("ece_153", ["ECE 153A", "ECE 153B"], "ECE 153A or 153B")}
  ${and("upper_div", ["upper_div_core", "ece_153"], "Upper-Division Required Courses")}

  // Departmental electives: 36 units
  ${electiveCourses("listed_electives", ELECTIVES, { subject: "ECE", number: "^194([A-QS-Z]|[A-Z][A-Z])$" })}
  ${cappedUnits("independent", ["ECE 192", "ECE 196"], 4)}
  ${firstCoursesUnits("materials", ["MATRL 100B", "MATRL 101"], 1)}
  ${firstCoursesUnits("tmp", ["TMP 120", "TMP 122"], 1)}
  // With both ECE 153A and 153B planned, one is the required course and the
  // other an elective.
  number second_153_units sum_units(slice(ece_153_matches, 1, 2))
  number elective_units add([sum_units(listed_electives), independent_units, materials_units, tmp_units, second_153_units])
  NumberRequirement elective_units_req {elective_units, 36, "36 Units of Departmental Electives"}

  // Depth sequence: one of the ECE Department's tracks, or the student's own.
  ${someOf("track_signal", ["ECE 130C", "ECE 133", "ECE 148", "ECE 158", "ECE 178", "ECE 180", "ECE 181", "ECE 186"], "Signal Processing and Sensing: 4 of ECE 130C, 133, 148, 158, 178, 180, 181, 186", 4)}
  ${someOf("track_wireless", ["ECE 130C", "ECE 146A", "ECE 146B", "ECE 148", "ECE 158"], "Wireless Communications and Sensing: 4 of ECE 130C, 146A, 146B, 148, 158", 4)}
  ${allOf("architecture_required", ["ECE 154A", "ECE 154B"], "ECE 154A-B")}
  ${someOf("architecture_two", ["ECE 152B", "ECE 153A", "ECE 153B"], "2 of ECE 152B, 153A, 153B", 2)}
  ${and("track_architecture", ["architecture_required", "architecture_two"], "Computer Architecture")}
  ${someOf("track_robotics", ["ECE 130C", "ECE 147A", "ECE 147B", "ECE 147C", "ECE 179D"], "Robotics and Control: 4 of ECE 130C, 147A, 147B, 147C, 179D", 4)}
  ${someOf("track_photonics", ["ECE 132", "ECE 135", "ECE 136A", "ECE 136B", "ECE 136C", "ECE 144", "ECE 162A", "MATRL 162A", "ECE 162B", "MATRL 162B", "ECE 162C"], "Photonics: 4 of ECE 132, 135, 136A-C, 144, 162A-C", 4)}
  ${someOf("vlsi_first", ["ECE 122A", "ECE 123"], "ECE 122A or 123")}
  ${allOf("vlsi_122b", ["ECE 122B"], "ECE 122B")}
  ${someOf("vlsi_two", ["ECE 132", "ECE 157A", "ECE 157B"], "2 of ECE 132, 157A, 157B", 2)}
  ${and("track_vlsi", ["vlsi_first", "vlsi_122b", "vlsi_two"], "Digital VLSI")}
  ${allOf("track_high_speed", ["ECE 132", "ECE 137A", "ECE 137B", "ECE 145A", "ECE 145B"], "High Speed, High Frequency Integrated Circuits")}
  ${allOf("semiconductors_required", ["ECE 120A", "ECE 132", "ECE 137A", "ECE 142"], "ECE 120A, 132, 137A, 142")}
  ${someOf("semiconductors_120b", ["ECE 120B", "ECE 137B"], "ECE 120B or 137B")}
  ${and("track_semiconductors", ["semiconductors_required", "semiconductors_120b"], "Semiconductors and Integrated Circuits")}
  ${someOf("track_ml", ["ECE 133", "ECE 157A", "ECE 157B", "ECE 180", "ECE 181", "ECE 186"], "Machine Learning: 4 of ECE 133, 157A, 157B, 180, 181, 186", 4)}
  ${byHand("track_own", "Your own track, approved by a faculty adviser")}
  ${or(
    "depth_sequence",
    [
      "track_signal",
      "track_wireless",
      "track_architecture",
      "track_robotics",
      "track_photonics",
      "track_vlsi",
      "track_high_speed",
      "track_semiconductors",
      "track_ml",
      "track_own",
    ],
    "A depth sequence in one track"
  )}
  ${and("electives", ["elective_units_req", "depth_sequence"], "Departmental Electives")}

  ${totalUnits("graduation_units", 189, "Electrical Engineering")}
`,
  ["preparation", "upper_div", "electives", "graduation_units"]
);
