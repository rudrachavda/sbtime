import { UcsbClient } from "./client.ts";

/**
 * Types for the Academic Curriculums API v3
 * (https://developer.ucsb.edu/content/academic-curriculums).
 *
 * String fields arrive padded with spaces ("ANTH      3  ", "L&S "); callers
 * are expected to trim them.
 */

export interface UcsbGeneralEducation {
  /** Area or special-subject code, for example "D" or "WRT". */
  geCode: string;
  /** College the code applies to: "L&S", "ENGR", "CRST" or "UCSB". */
  geCollege: string;
}

export interface UcsbClassTimeLocation {
  room: string | null;
  building: string | null;
  roomCapacity: number | null;
  /** Seven characters, one per day: "M W F  " or " T R   ". */
  days: string | null;
  /** 24-hour "HH:mm". */
  beginTime: string | null;
  endTime: string | null;
}

export interface UcsbClassInstructor {
  /** Family name followed by initials, for example "SMITH S T". */
  instructor: string | null;
  /** For example "Teaching and in charge". */
  functionCode: string | null;
}

export interface UcsbClassSection {
  enrollCode: string;
  /** "0100" is a lecture; "0101", "0102" are its discussions or labs. */
  section: string;
  session: string | null;
  /** "Y" when closed. */
  classClosed: string | null;
  /** Non-empty when cancelled. */
  courseCancelled: string | null;
  gradingOptionCode: string | null;
  enrolledTotal: number | null;
  maxEnroll: number | null;
  secondaryStatus: string | null;
  departmentApprovalRequired: boolean | null;
  instructorApprovalRequired: boolean | null;
  restrictionLevel: string | null;
  restrictionMajor: string | null;
  restrictionMajorPass: string | null;
  restrictionMinor: string | null;
  restrictionMinorPass: string | null;
  concurrentCourses: string[] | null;
  /** "LEC", "DIS", "LAB", ... */
  typeInstruction?: string | null;
  timeLocations: UcsbClassTimeLocation[] | null;
  instructors: UcsbClassInstructor[] | null;
}

export interface UcsbClass {
  quarter: string;
  /** Subject (8 characters) followed by the course number (5 characters). */
  courseId: string;
  title: string | null;
  contactHours: number | null;
  description: string | null;
  college: string | null;
  /** "U" (undergraduate) or "G" (graduate). */
  objLevelCode: string | null;
  subjectArea: string | null;
  unitsFixed: number | null;
  unitsVariableHigh: number | null;
  unitsVariableLow: number | null;
  delayedSectioning: string | null;
  inProgressCourse: string | null;
  /** "L" (letter only), "P" (pass/no pass only) or null (student's choice). */
  gradingOption: string | null;
  instructionType: string | null;
  onLineCourse: boolean | null;
  deptCode: string | null;
  generalEducation: UcsbGeneralEducation[] | null;
  classSections: UcsbClassSection[] | null;
}

interface UcsbClassPage {
  pageNumber: number;
  pageSize: number;
  total: number;
  classes: UcsbClass[] | null;
}

const BASE_PATH = "/academics/curriculums/v3";

/** The API rejects anything larger. */
export const MAX_CLASS_PAGE_SIZE = 500;

/**
 * Every class offered in a quarter, with its sections. Walks the pages until
 * the reported total is reached or a page comes back empty.
 */
export const getQuarterClasses = async (
  client: UcsbClient,
  quarter: string,
  onPage?: (fetched: number, total: number) => void
): Promise<UcsbClass[]> => {
  const classes: UcsbClass[] = [];

  for (let pageNumber = 1; ; pageNumber++) {
    const page = await client.get<UcsbClassPage>(
      `${BASE_PATH}/classes/search`,
      {
        quarter,
        pageNumber,
        pageSize: MAX_CLASS_PAGE_SIZE,
        includeClassSections: true,
      }
    );

    const batch = page.classes ?? [];
    classes.push(...batch);
    onPage?.(classes.length, page.total);

    // A page can come back one short of pageSize, so stop on the reported
    // total (or an empty page) instead of on a short page.
    if (batch.length === 0 || pageNumber * MAX_CLASS_PAGE_SIZE >= page.total) {
      break;
    }
  }

  return classes;
};

export interface UcsbFinalExam {
  hasFinals: boolean | null;
  comments: string | null;
  /** "M", "T", ... */
  examDay: string | null;
  /** "20261207" */
  examDate: string | null;
  /** "16:00" */
  beginTime: string | null;
  endTime: string | null;
}

/** The final exam for one class (lecture), by quarter and enroll code. */
export const getFinalExam = (
  client: UcsbClient,
  quarter: string,
  enrollCode: string
) => client.get<UcsbFinalExam>(`${BASE_PATH}/finals`, { quarter, enrollCode });
