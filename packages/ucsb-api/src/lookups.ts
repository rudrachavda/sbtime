import { UcsbClient } from "./client.ts";

/**
 * The Registrar's code tables, from the Student Record Code Lookups API
 * (https://developer.ucsb.edu/content/student-record-code-lookups). These
 * hold reference data only, no student records.
 *
 * Codes can contain runs of spaces ("ART  CS", "ED   E"); callers should
 * normalise them before matching.
 */

export interface UcsbSubject {
  subjectCode: string;
  subjectTranslation: string;
  deptCode: string | null;
  collegeCode: string | null;
  relatedDeptCode: string | null;
  inactive: boolean;
}

export interface UcsbDepartment {
  deptCode: string;
  deptTranslationShort: string | null;
  deptTranslation: string;
  collegeCode: string | null;
  divisionCode: string | null;
  orgCode: string | null;
  inactive: boolean;
}

export interface UcsbCollege {
  collegeCode: string;
  collegeTranslation: string;
  orgCode: string | null;
  inactive: boolean;
}

export interface UcsbMajor {
  majorCode: string;
  majorTranslationShort: string | null;
  majorTranslation: string;
  collegeCode: string | null;
  preMajorCode: string | null;
  deptCode: string | null;
  inactive: boolean;
}

export interface UcsbMinor {
  minorCode: string;
  minorTranslationShort: string | null;
  minorTranslation: string;
  collegeCode: string | null;
  departmentCode: string | null;
  inactive: boolean;
}

export interface UcsbCollegeRequirement {
  requirementCode: string;
  requirementTranslation: string;
  collegeCode: string;
  objCode: string | null;
  courseCount: number | null;
  units: number | null;
  inactive: boolean;
}

export interface UcsbRequirementCourse {
  requirementCode: string;
  collegeCode: string;
  /** Same fixed-width format as the class search's courseId. */
  courseCode: string;
  startQuarter: string;
  thruQuarter: string;
}

const BASE_PATH = "/students/lookups/v1";

export const getSubjects = (client: UcsbClient) =>
  client.get<UcsbSubject[]>(`${BASE_PATH}/subjects`);

export const getDepartments = (client: UcsbClient) =>
  client.get<UcsbDepartment[]>(`${BASE_PATH}/departments`);

export const getColleges = (client: UcsbClient) =>
  client.get<UcsbCollege[]>(`${BASE_PATH}/colleges`);

export const getMajors = (client: UcsbClient) =>
  client.get<UcsbMajor[]>(`${BASE_PATH}/majors`);

export const getMinors = (client: UcsbClient) =>
  client.get<UcsbMinor[]>(`${BASE_PATH}/minors`);

export const getCollegeRequirements = (client: UcsbClient) =>
  client.get<UcsbCollegeRequirement[]>(`${BASE_PATH}/requirements`);

export const getRequirementCourses = (client: UcsbClient) =>
  client.get<UcsbRequirementCourse[]>(`${BASE_PATH}/requirementcourses`);
