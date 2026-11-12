/**
 * Computer Science (College of Engineering), B.S., from the 2026-27 GEAR,
 * page 20.
 *
 * - Preparation: CMPSC 16, 24, 32, 41, 42, 64; MATH 3A-B, 4A-B, 6A;
 *   PSTAT 120A.
 * - Upper division: CMPSC 130A-B and ENGR 101.
 * - Major field electives: 14 courses from the GEAR list, at least 7 of them
 *   CMPSC courses. CMPSC 192 and 196 together count for at most 4 units
 *   (treated here as one course). "CMPSC 190AA-ZZ" is matched as any
 *   CMPSC 190 with a letter suffix. Cross-listed courses count as CMPSC only
 *   when planned under CMPSC.
 * - Science electives (List A, 8 units; List B, 12 units): the department's
 *   lists are not in the GEAR, so students check this off by hand.
 *
 * Not checked: letter grades, and the GPA rule on CMPSC 192/196.
 * The order of the returned requirements is stored with each plan's manual
 * check-offs, so append new requirements at the end.
 */
export const UCSB_COMPUTER_SCIENCE_BTLL = `
Function<boolean>(Course) cmpsc_190_finder (course){
  boolean is_cmpsc equal([get_attr(course, "subject"), "CMPSC"])
  boolean is_190 regex_match(get_attr(course, "number"), "^190[A-Z][A-Z]?$")
  boolean return and([is_cmpsc, is_190])
}

Function<List<Requirement>>() main (){
  List<Course> courses get_attr(this, "allCourses")

  // Preparation for the major
  List<Course> cmpsc_prep_list [{"CMPSC 16"}, {"CMPSC 24"}, {"CMPSC 32"}, {"CMPSC 41"}, {"CMPSC 42"}, {"CMPSC 64"}]
  List<boolean> cmpsc_prep_status common_course_matches(cmpsc_prep_list, courses)
  CourseListRequirement cmpsc_prep {cmpsc_prep_list, cmpsc_prep_status, "Computer Science"}

  List<Course> math_prep_list [{"MATH 3A"}, {"MATH 3B"}, {"MATH 4A"}, {"MATH 4B"}, {"MATH 6A"}, {"PSTAT 120A"}]
  List<boolean> math_prep_status common_course_matches(math_prep_list, courses)
  CourseListRequirement math_prep {math_prep_list, math_prep_status, "Mathematics and Statistics"}

  AndRequirement preparation {[cmpsc_prep, math_prep], "Preparation for the Major"}

  // Upper-division required courses
  List<Course> upper_div_list [{"CMPSC 130A"}, {"CMPSC 130B"}, {"ENGR 101"}]
  List<boolean> upper_div_status common_course_matches(upper_div_list, courses)
  CourseListRequirement upper_div {upper_div_list, upper_div_status, "Upper-Division Required Courses"}

  // Major field electives
  List<Course> cmpsc_elective_list [{"CMPSC 110"}, {"CMPSC 111"}, {"CMPSC 132"}, {"CMPSC 134"}, {"CMPSC 138"}, {"CMPSC 140"}, {"CMPSC 148"}, {"CMPSC 153A"}, {"CMPSC 154"}, {"CMPSC 156"}, {"CMPSC 160"}, {"CMPSC 162"}, {"CMPSC 165A"}, {"CMPSC 165B"}, {"CMPSC 170"}, {"CMPSC 171"}, {"CMPSC 172"}, {"CMPSC 174A"}, {"CMPSC 174B"}, {"CMPSC 176A"}, {"CMPSC 176B"}, {"CMPSC 176C"}, {"CMPSC 177"}, {"CMPSC 178"}, {"CMPSC 179P"}, {"CMPSC 180"}, {"CMPSC 181"}, {"CMPSC 184"}, {"CMPSC 185"}, {"CMPSC 186"}, {"CMPSC 188"}, {"CMPSC 189A"}, {"CMPSC 189B"}, {"CMPSC 196B"}]
  List<Course> other_elective_list [{"ECE 130A"}, {"ECE 130B"}, {"ECE 130C"}, {"ECE 152A"}, {"ECE 153A"}, {"ECE 153B"}, {"ECE 160"}, {"ECE 178"}, {"ECE 179P"}, {"ECE 181"}, {"MATH 108A"}, {"MATH 108B"}, {"MATH 119A"}, {"MATH 119B"}, {"MATH 124A"}, {"MATH 124B"}, {"PSTAT 120B"}, {"PSTAT 122"}, {"PSTAT 130"}, {"PSTAT 160A"}, {"PSTAT 160B"}]
  List<Course> independent_study_list [{"CMPSC 192"}, {"CMPSC 196"}]

  List<Course> cmpsc_electives filter(courses, (c) {
    boolean on_list one_common_course([c], cmpsc_elective_list)
    boolean return or([on_list, cmpsc_190_finder(c)])
  })
  List<Course> other_electives filter(courses, (c) {
    boolean return one_common_course([c], other_elective_list)
  })
  List<Course> independent_study filter(courses, (c) {
    boolean return one_common_course([c], independent_study_list)
  })
  // CMPSC 192 and 196 together count for at most 4 units: one course.
  number independent_count if_else(greater_than(length(independent_study), 0), 1, 0)

  number cmpsc_elective_count add([length(cmpsc_electives), independent_count])
  number elective_count add([cmpsc_elective_count, length(other_electives)])

  List<Course> all_electives filter(courses, (c) {
    boolean is_cmpsc one_common_course([c], cmpsc_electives)
    boolean is_other one_common_course([c], other_electives)
    boolean is_independent one_common_course([c], independent_study)
    boolean return or([is_cmpsc, is_other, is_independent])
  })
  List<Course> all_cmpsc_electives filter(courses, (c) {
    boolean is_cmpsc one_common_course([c], cmpsc_electives)
    boolean is_independent one_common_course([c], independent_study)
    boolean return or([is_cmpsc, is_independent])
  })
  NCoursesRequirement electives_total {all_electives, elective_count, 14, "14 Major Field Electives"}
  NCoursesRequirement electives_cmpsc {all_cmpsc_electives, cmpsc_elective_count, 7, "At least 7 CMPSC Electives"}
  AndRequirement electives {[electives_total, electives_cmpsc], "Major Field Electives"}

  // Science electives: the department's approved lists are not in the GEAR.
  BooleanRequirement science_electives {false, "Science Electives: List A (8 units) and List B (12 units) from the department's lists"}

  List<Requirement> return [preparation, upper_div, electives, science_electives]
}
`;
