/**
 * UCSB university requirements, which every undergraduate must meet:
 * Entry Level Writing, American History & Institutions and 180 units.
 *
 * Courses carry UCSB's GE tags as "<college>:<code>" strings in
 * `breadthRequirements` (e.g. "ENGR:A1"), and their university tag
 * ("SUB" or "AMH") in `universityRequirement`.
 *
 * The order of the returned requirements is stored with each plan's manual
 * check-offs, so append new requirements at the end.
 */
export const UCSB_UNIVERSITY_REQ_BTLL = `
Function<boolean>(Course) entry_level_writing_finder (course){
  string university_requirement get_attr(course, "universityRequirement")
  List<string> ge get_attr(course, "breadthRequirements")
  // Area A courses need Entry Level Writing first, so planning one means it is met.
  boolean area_a or([contains(ge, "ENGR:A1"), contains(ge, "ENGR:A2"), contains(ge, "L&S:A1"), contains(ge, "L&S:A2")])
  boolean return or([equal([university_requirement, "SUB"]), area_a])
}

Function<boolean>(Course) american_history_finder (course){
  string university_requirement get_attr(course, "universityRequirement")
  boolean return equal([university_requirement, "AMH"])
}

Function<List<Requirement>>() main (){
  List<Course> courses get_attr(this, "allCourses")

  List<Course> entry_level_writing_matches filter(courses, entry_level_writing_finder)
  NCoursesRequirement entry_level_writing {entry_level_writing_matches, 1, "Entry Level Writing"}

  List<Course> american_history_matches filter(courses, american_history_finder)
  NCoursesRequirement american_history {american_history_matches, 1, "American History & Institutions"}

  number total_units get_attr(this, "units")
  NumberRequirement total_units_req {total_units, 180, "Minimum 180 Units"}

  List<Requirement> return [entry_level_writing, american_history, total_units_req]
}
`;
