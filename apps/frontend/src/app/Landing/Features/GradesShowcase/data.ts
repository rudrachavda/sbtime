// PSTAT 120A (Probability and Statistics): grade distributions for the two
// instructors who have taught it most, every section combined. Read from
// production (gradedistributions joined to sections' instructors) on
// 2026-11-13. The showcase never calls the API; edit this file to change it.

export const GRADES_COURSE = "PSTAT 120A";
export const GRADES_TITLE = "Probability and Statistics";

export const GRADES = [
  "A+",
  "A",
  "A-",
  "B+",
  "B",
  "B-",
  "C+",
  "C",
  "C-",
  "D+",
  "D",
  "D-",
  "F",
] as const;

// Grade points for each letter, in the order above
const POINTS = [4, 4, 3.7, 3.3, 3, 2.7, 2.3, 2, 1.7, 1.3, 1, 0.7, 0];

export interface InstructorGrades {
  name: string;
  quarters: number;
  /** One count per grade, in GRADES order */
  counts: number[];
  /** A @repo/theme color name */
  color: "blue" | "orange";
}

export const INSTRUCTORS: InstructorGrades[] = [
  {
    name: "B. Wainwright",
    quarters: 8,
    counts: [54, 675, 158, 172, 302, 105, 99, 256, 11, 35, 31, 5, 89],
    color: "blue",
  },
  {
    name: "U. V. Ravat",
    quarters: 4,
    counts: [1, 160, 130, 107, 115, 84, 100, 132, 83, 17, 37, 1, 69],
    color: "orange",
  },
];

export const totalOf = (instructor: InstructorGrades) =>
  instructor.counts.reduce((sum, count) => sum + count, 0);

export const averageGpa = (instructor: InstructorGrades) =>
  instructor.counts.reduce((sum, count, i) => sum + count * POINTS[i], 0) /
  totalOf(instructor);

// PSTAT 120A across every instructor (73 sections, 43 quarters): the real
// page's "Course Average"
export const COURSE_AVERAGE_GPA = 2.777;
