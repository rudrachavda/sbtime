import { IGradeDistributionItem, ISectionItem } from "@repo/common/models";

import { REGULAR_SESSION_ID, parseCourseId } from "./ucsb-catalog";

/**
 * UCSB grade distributions published by the Daily Nexus
 * (https://github.com/dailynexusdata/grades-data), obtained from the Office
 * of the Registrar through Public Records Act requests. "All data is free to
 * reuse." One row per course, instructor and quarter; courses with fewer than
 * five students are not included.
 */

export const NEXUS_GRADES_URL =
  "https://raw.githubusercontent.com/dailynexusdata/grades-data/main/courseGrades.csv";

export interface NexusGradeRow {
  /** UCSB's fixed-width course id, "CMPSC   130A". */
  course: string;
  /** Family name then initials, "DEAN C W". */
  instructor: string;
  /** "Fall", "Winter", "Spring" or "Summer". */
  quarter: string;
  /** Calendar year of the quarter. */
  year: string;
  [column: string]: string;
}

/** Parse the CSV. Fields are simple, but quoted values are handled anyway. */
export const parseNexusCsv = (text: string): NexusGradeRow[] => {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length === 0) return [];

  const splitLine = (line: string) => {
    const fields: string[] = [];
    let current = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (quoted) {
        if (char === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (char === '"') quoted = false;
        else current += char;
      } else if (char === '"') quoted = true;
      else if (char === ",") {
        fields.push(current);
        current = "";
      } else current += char;
    }
    fields.push(current);
    return fields;
  };

  const header = splitLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitLine(line);
    return Object.fromEntries(
      header.map((name, i) => [name, values[i] ?? ""])
    ) as NexusGradeRow;
  });
};

const SEASON_DIGIT: Record<string, string> = {
  winter: "1",
  spring: "2",
  summer: "3",
  fall: "4",
};

/** "Fall", "2020" -> "20204" */
export const nexusTermId = (quarter: string, year: string): string | null => {
  const digit = SEASON_DIGIT[quarter.trim().toLowerCase()];
  return digit && /^\d{4}$/.test(year.trim()) ? `${year.trim()}${digit}` : null;
};

const count = (row: NexusGradeRow, column: string) => {
  const value = Number(row[column]);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
};

export type GradeCountFields = Pick<
  IGradeDistributionItem,
  | "count"
  | "distinct"
  | "countAPlus"
  | "countA"
  | "countAMinus"
  | "countBPlus"
  | "countB"
  | "countBMinus"
  | "countCPlus"
  | "countC"
  | "countCMinus"
  | "countDPlus"
  | "countD"
  | "countDMinus"
  | "countF"
  | "countP"
  | "countNP"
  | "countS"
  | "countU"
  | "countCR"
  | "countNC"
  | "countHH"
  | "countH"
  | "countPC"
>;

/**
 * Map a row's columns onto the grade fields. Letter counts are recorded
 * before pass/no pass conversion. "No pass" is not published, so it is the
 * students in pass/no pass classes who did not pass.
 */
export const toGradeCounts = (row: NexusGradeRow): GradeCountFields => {
  const passed = count(row, "P");
  const grades = {
    countAPlus: count(row, "Ap"),
    countA: count(row, "A"),
    countAMinus: count(row, "Am"),
    countBPlus: count(row, "Bp"),
    countB: count(row, "B"),
    countBMinus: count(row, "Bm"),
    countCPlus: count(row, "Cp"),
    countC: count(row, "C"),
    countCMinus: count(row, "Cm"),
    countDPlus: count(row, "Dp"),
    countD: count(row, "D"),
    countDMinus: count(row, "Dm"),
    countF: count(row, "F"),
    countP: passed,
    countNP: Math.max(0, count(row, "nPNPStudents") - passed),
    countS: count(row, "S"),
    countU: count(row, "su"),
    countCR: 0,
    countNC: 0,
    countHH: 0,
    countH: 0,
    countPC: 0,
  };

  const values = Object.values(grades);
  return {
    ...grades,
    count: values.reduce((sum, value) => sum + value, 0),
    distinct: values.filter((value) => value > 0).length,
  };
};

export const addGradeCounts = (
  a: GradeCountFields,
  b: GradeCountFields
): GradeCountFields => {
  const sum = Object.fromEntries(
    Object.keys(a).map((key) => [
      key,
      a[key as keyof GradeCountFields] + b[key as keyof GradeCountFields],
    ])
  ) as GradeCountFields;
  const { count: _count, distinct: _distinct, ...grades } = sum;
  void _count;
  void _distinct;
  const values = Object.values(grades);
  return {
    ...sum,
    count: values.reduce((total, value) => total + value, 0),
    distinct: values.filter((value) => value > 0).length,
  };
};

const squash = (value: string | undefined) =>
  (value ?? "").replace(/\s+/g, " ").trim().toUpperCase();

export type Lecture = Pick<
  ISectionItem,
  "sectionId" | "number" | "courseId" | "subject" | "courseNumber" | "meetings"
>;

/**
 * The lecture a row's grades belong to. Matches on the instructor; when the
 * course had a single lecture that quarter, that lecture is used even if the
 * instructor is listed differently. Returns null rather than guess between
 * lectures taught by other instructors.
 */
export const matchGradeRow = (
  row: NexusGradeRow,
  lectures: Lecture[]
): Lecture | null => {
  if (lectures.length === 0) return null;

  const instructor = squash(row.instructor);
  const taughtBy = lectures
    .filter((lecture) =>
      lecture.meetings?.some((meeting) =>
        meeting.instructors?.some(
          (person) =>
            squash(`${person.familyName ?? ""} ${person.givenName ?? ""}`) ===
            instructor
        )
      )
    )
    .sort((a, b) => a.number.localeCompare(b.number));

  // Several lectures by the same instructor share one row: credit the first.
  if (taughtBy.length > 0) return taughtBy[0];
  return lectures.length === 1 ? lectures[0] : null;
};

/** Build the stored grade record for a lecture. */
export const toGradeDistribution = (
  termId: string,
  lecture: Lecture,
  counts: GradeCountFields
): IGradeDistributionItem => ({
  courseId: lecture.courseId,
  subject: lecture.subject,
  courseNumber: lecture.courseNumber,
  courseOfferingNumber: 1,
  termId,
  sessionId: REGULAR_SESSION_ID,
  sectionId: lecture.sectionId,
  sectionNumber: lecture.number,
  ...counts,
});

/** "CMPSC   130A" -> "CMPSC 130A", the id the catalog uses. */
export const nexusCourseId = (course: string) =>
  parseCourseId(course)?.courseId ?? null;
