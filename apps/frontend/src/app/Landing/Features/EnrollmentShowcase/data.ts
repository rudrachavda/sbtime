// PSY 1 (Introduction to Psychology), Fall 2026, lecture 0100: its daily
// enrollment history, read from the production enrollmenthistories
// collection on 2026-11-13. Seats were limited to 205 at first, then raised
// to 840. The showcase never calls the API; edit this file to change it.

export const ENROLLMENT_COURSE = "PSY 1";
export const ENROLLMENT_TITLE = "Introduction to Psychology";
export const ENROLLMENT_TERM = "Fall 2026";
export const ENROLLMENT_SECTION = "0100";

export interface EnrollmentPoint {
  /** YYYY-MM-DD */
  date: string;
  enrolled: number;
  capacity: number;
}

export const ENROLLMENT_HISTORY: EnrollmentPoint[] = [
  { date: "2026-04-27", enrolled: 0, capacity: 205 },
  { date: "2026-05-12", enrolled: 23, capacity: 205 },
  { date: "2026-05-13", enrolled: 28, capacity: 205 },
  { date: "2026-05-14", enrolled: 39, capacity: 205 },
  { date: "2026-05-15", enrolled: 88, capacity: 205 },
  { date: "2026-05-16", enrolled: 90, capacity: 205 },
  { date: "2026-05-18", enrolled: 90, capacity: 205 },
  { date: "2026-05-20", enrolled: 105, capacity: 205 },
  { date: "2026-05-21", enrolled: 125, capacity: 205 },
  { date: "2026-05-23", enrolled: 186, capacity: 205 },
  { date: "2026-05-26", enrolled: 191, capacity: 205 },
  { date: "2026-05-28", enrolled: 194, capacity: 205 },
  { date: "2026-06-02", enrolled: 194, capacity: 205 },
  { date: "2026-06-05", enrolled: 194, capacity: 205 },
  { date: "2026-06-10", enrolled: 195, capacity: 205 },
  { date: "2026-06-15", enrolled: 197, capacity: 205 },
  { date: "2026-06-20", enrolled: 205, capacity: 205 },
  { date: "2026-08-20", enrolled: 817, capacity: 840 },
  { date: "2026-09-10", enrolled: 836, capacity: 840 },
  { date: "2026-09-12", enrolled: 835, capacity: 840 },
  { date: "2026-09-22", enrolled: 840, capacity: 840 },
  { date: "2026-11-11", enrolled: 826, capacity: 840 },
  { date: "2026-11-13", enrolled: 826, capacity: 840 },
];

// Month labels along the bottom of the chart
export const MONTH_TICKS = [
  { date: "2026-05-01", label: "May" },
  { date: "2026-07-01", label: "Jul" },
  { date: "2026-09-01", label: "Sep" },
  { date: "2026-11-01", label: "Nov" },
];

// Fall 2026 registration passes (production enrollmenttimeframes): the
// dashed markers on the real Enrollment chart
export const PHASES = [
  { date: "2026-05-11", label: "Pass 1" },
  { date: "2026-05-18", label: "Pass 2" },
  { date: "2026-09-08", label: "Pass 3" },
];
