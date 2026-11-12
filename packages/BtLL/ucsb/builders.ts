/**
 * Small helpers that write BtLL for common major-requirement shapes, so each
 * major's program reads like its GEAR page. Every helper declares variables
 * named after `id`, so ids must be unique within a program, and every helper
 * reads the plan's courses from a variable called `courses`.
 */

const list = (courses: string[]) =>
  `[${courses.map((course) => `{"${course}"}`).join(", ")}]`;

const quote = (text: string) => `"${text.replace(/"/g, "'")}"`;

/** Courses on `courses` that appear in the list variable `listVar`. */
const matches = (id: string, listVar: string) => `
  List<Course> ${id} filter(courses, (c) {
    boolean return one_common_course([c], ${listVar})
  })`;

/** Every course in the list: CMPSC 130A, CMPSC 130B, ... */
export const allOf = (id: string, courses: string[], description: string) => `
  List<Course> ${id}_list ${list(courses)}
  List<boolean> ${id}_status common_course_matches(${id}_list, courses)
  CourseListRequirement ${id} {${id}_list, ${id}_status, ${quote(description)}}`;

/** At least `count` courses from the list (default one): CHEM 109A or 130A. */
export const someOf = (
  id: string,
  courses: string[],
  description: string,
  count = 1
) => `
  List<Course> ${id}_list ${list(courses)}${matches(`${id}_matches`, `${id}_list`)}
  NCoursesRequirement ${id} {${id}_matches, ${count}, ${quote(description)}}`;

/** All of the named requirements. */
export const and = (id: string, parts: string[], description: string) => `
  AndRequirement ${id} {[${parts.join(", ")}], ${quote(description)}}`;

/** Any one of the named requirements. */
export const or = (id: string, parts: string[], description: string) => `
  OrRequirement ${id} {[${parts.join(", ")}], ${quote(description)}}`;

/**
 * Elective courses: `${id}` is the list of planned courses on the list.
 * `pattern` adds courses matched by subject and a number regex, for ranges
 * such as "CMPSC 190AA-ZZ".
 */
export const electiveCourses = (
  id: string,
  courses: string[],
  pattern?: { subject: string; number: string }
) => {
  if (!pattern)
    return `
  List<Course> ${id}_list ${list(courses)}${matches(id, `${id}_list`)}`;
  return `
  List<Course> ${id}_list ${list(courses)}
  List<Course> ${id} filter(courses, (c) {
    boolean on_list one_common_course([c], ${id}_list)
    boolean is_subject equal([get_attr(c, "subject"), "${pattern.subject}"])
    boolean is_number regex_match(get_attr(c, "number"), "${pattern.number}")
    boolean return or([on_list, and([is_subject, is_number])])
  })`;
};

/**
 * Units from a group of courses that count for at most `maxUnits` combined
 * (e.g. "CMPSC 192 and 196: four units maximum"). Declares
 * `${id}` (the planned courses) and `${id}_units` (the capped units).
 */
export const cappedUnits = (id: string, courses: string[], maxUnits: number) =>
  `
  List<Course> ${id}_list ${list(courses)}${matches(id, `${id}_list`)}
  number ${id}_raw_units sum_units(${id})
  number ${id}_units if_else(greater_than(${id}_raw_units, ${maxUnits}), ${maxUnits}, ${id}_raw_units)`;

/**
 * Units from a group of courses of which only the first `maxCourses` count
 * (e.g. "TMP 120, 122: one course maximum"). Declares `${id}` (the planned
 * courses) and `${id}_units`.
 */
export const firstCoursesUnits = (
  id: string,
  courses: string[],
  maxCourses: number
) => `
  List<Course> ${id}_list ${list(courses)}${matches(id, `${id}_list`)}
  number ${id}_units sum_units(slice(${id}, 0, ${maxCourses}))`;

/** A requirement the plan cannot check, for the student to tick off. */
export const byHand = (id: string, description: string) => `
  BooleanRequirement ${id} {false, ${quote(description)}}`;

/** A major's own graduation unit minimum, when it is above 180. */
export const totalUnits = (id: string, units: number, major: string) => `
  number ${id}_actual get_attr(this, "units")
  NumberRequirement ${id} {${id}_actual, ${units}, ${quote(`Minimum ${units} Units for ${major}`)}}`;

/** Wraps a program body in `main`, returning the listed requirements. */
export const program = (body: string, returns: string[]) => `
Function<List<Requirement>>() main (){
  List<Course> courses get_attr(this, "allCourses")
${body}

  List<Requirement> return [${returns.join(", ")}]
}
`;
