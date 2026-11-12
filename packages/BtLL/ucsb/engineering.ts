/**
 * College of Engineering General Education requirements, from the 2026-27
 * GEAR (General Engineering Academic Requirements), pages 12-13.
 *
 * - Area A: one A-1 course (Writing 2 or 2E) and one A-2 course.
 * - Areas D-G: at least 6 courses, with at least 2 in D, 2 in E, 1 in F and
 *   1 in G. A course listed in several areas counts toward only one of them.
 * - Special subject areas, met along the way: 4 Writing courses, 1
 *   Ethnicity course, and 1 European Traditions or World Cultures course.
 *
 * Courses carry the college's own GE tags ("ENGR:D", "ENGR:WRT", ...).
 * The order of the returned requirements is stored with each plan's manual
 * check-offs, so append new requirements at the end.
 */
export const UCSB_ENGINEERING_GE_BTLL = `
Function<boolean>(Course, string) has_tag (course, tag){
  List<string> ge get_attr(course, "breadthRequirements")
  boolean return contains(ge, tag)
}

Function<List<Requirement>>() main (){
  List<Course> courses get_attr(this, "allCourses")

  // Area A: English Reading & Composition
  List<Course> a1_eligible filter(courses, (c) {
    boolean return has_tag(c, "ENGR:A1")
  })
  NCoursesRequirement a1 {a1_eligible, 1, "Area A-1"}
  List<Course> a2_eligible filter(courses, (c) {
    boolean return has_tag(c, "ENGR:A2")
  })
  NCoursesRequirement a2 {a2_eligible, 1, "Area A-2"}
  AndRequirement area_a {[a1, a2], "Area A: English Reading & Composition"}

  // Areas D-G. Each course counts toward one area only, so courses are
  // handed out greedily: F and G first (preferring courses that are not
  // also in Area E, the area that overlaps the most), then D, then E.
  List<Course> d_eligible filter(courses, (c) {
    boolean return has_tag(c, "ENGR:D")
  })
  List<Course> e_eligible filter(courses, (c) {
    boolean return has_tag(c, "ENGR:E")
  })
  List<Course> f_eligible filter(courses, (c) {
    boolean return has_tag(c, "ENGR:F")
  })
  List<Course> g_eligible filter(courses, (c) {
    boolean return has_tag(c, "ENGR:G")
  })

  List<Course> f_preferred filter(f_eligible, (c) {
    boolean return not(has_tag(c, "ENGR:E"))
  })
  List<Course> f_courses if_else(greater_than(length(f_preferred), 0), slice(f_preferred, 0, 1), slice(f_eligible, 0, 1))

  List<Course> g_pool filter(g_eligible, (c) {
    boolean return not(one_common_course([c], f_courses))
  })
  List<Course> g_preferred filter(g_pool, (c) {
    boolean return not(has_tag(c, "ENGR:E"))
  })
  List<Course> g_courses if_else(greater_than(length(g_preferred), 0), slice(g_preferred, 0, 1), slice(g_pool, 0, 1))

  List<Course> d_pool filter(d_eligible, (c) {
    boolean used_f one_common_course([c], f_courses)
    boolean used_g one_common_course([c], g_courses)
    boolean return not(or([used_f, used_g]))
  })
  List<Course> d_courses slice(d_pool, 0, 2)

  List<Course> e_pool filter(e_eligible, (c) {
    boolean used_f one_common_course([c], f_courses)
    boolean used_g one_common_course([c], g_courses)
    boolean used_d one_common_course([c], d_courses)
    boolean return not(or([used_f, used_g, used_d]))
  })
  List<Course> e_courses slice(e_pool, 0, 2)

  NCoursesRequirement area_d {d_eligible, length(d_courses), 2, "Area D: Social Sciences (2 courses)"}
  NCoursesRequirement area_e {e_eligible, length(e_courses), 2, "Area E: Culture and Thought (2 courses)"}
  NCoursesRequirement area_f {f_eligible, length(f_courses), 1, "Area F: The Arts (1 course)"}
  NCoursesRequirement area_g {g_eligible, length(g_courses), 1, "Area G: Literature (1 course)"}

  List<Course> d_to_g_courses filter(courses, (c) {
    boolean return or([has_tag(c, "ENGR:D"), has_tag(c, "ENGR:E"), has_tag(c, "ENGR:F"), has_tag(c, "ENGR:G")])
  })
  NCoursesRequirement d_to_g_total {d_to_g_courses, 6, "At least 6 courses in Areas D-G"}
  AndRequirement areas_d_to_g {[d_to_g_total, area_d, area_e, area_f, area_g], "Areas D, E, F and G"}

  // Special subject areas
  List<Course> writing_courses filter(courses, (c) {
    boolean return has_tag(c, "ENGR:WRT")
  })
  NCoursesRequirement writing {writing_courses, 4, "Writing (4 courses)"}
  List<Course> ethnicity_courses filter(courses, (c) {
    boolean return has_tag(c, "ENGR:ETH")
  })
  NCoursesRequirement ethnicity {ethnicity_courses, 1, "Ethnicity"}
  List<Course> eur_nwc_courses filter(courses, (c) {
    boolean return or([has_tag(c, "ENGR:EUR"), has_tag(c, "ENGR:NWC")])
  })
  NCoursesRequirement eur_nwc {eur_nwc_courses, 1, "European Traditions or World Cultures"}
  AndRequirement special_areas {[writing, ethnicity, eur_nwc], "Special Subject Areas"}

  List<Requirement> return [area_a, areas_d_to_g, special_areas]
}
`;
