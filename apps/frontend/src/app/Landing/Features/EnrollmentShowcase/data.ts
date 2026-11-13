// MUS 114 (Music and Popular Culture in America), Fall 2026, lecture 0100:
// its daily enrollment history, read from the production
// enrollmenthistories collection on 2026-11-13. 120 seats the whole time; it
// filled across the first two passes, closed on May 23, lost a few seats over
// the summer and refilled. The showcase never calls the API; edit this file
// to change it.

export const ENROLLMENT_COURSE = "MUS 114";
export const ENROLLMENT_TITLE = "Music and Popular Culture in America";
export const ENROLLMENT_TERM = "Fall 2026";
export const ENROLLMENT_SECTION = "Lecture 0100";
// MUSIC 1145, as the app labels it
export const ENROLLMENT_LOCATION = "Music Building 1145";

export interface EnrollmentPoint {
  /** YYYY-MM-DD */
  date: string;
  enrolled: number;
  capacity: number;
}

export const ENROLLMENT_HISTORY: EnrollmentPoint[] = [
  { date: "2026-04-27", enrolled: 0, capacity: 120 },
  { date: "2026-05-12", enrolled: 12, capacity: 120 },
  { date: "2026-05-13", enrolled: 19, capacity: 120 },
  { date: "2026-05-14", enrolled: 47, capacity: 120 },
  { date: "2026-05-15", enrolled: 58, capacity: 120 },
  { date: "2026-05-16", enrolled: 56, capacity: 120 },
  { date: "2026-05-18", enrolled: 58, capacity: 120 },
  { date: "2026-05-20", enrolled: 70, capacity: 120 },
  { date: "2026-05-21", enrolled: 104, capacity: 120 },
  { date: "2026-05-23", enrolled: 120, capacity: 120 },
  { date: "2026-05-26", enrolled: 120, capacity: 120 },
  { date: "2026-05-28", enrolled: 119, capacity: 120 },
  { date: "2026-06-02", enrolled: 120, capacity: 120 },
  { date: "2026-06-05", enrolled: 120, capacity: 120 },
  { date: "2026-06-10", enrolled: 119, capacity: 120 },
  { date: "2026-06-15", enrolled: 118, capacity: 120 },
  { date: "2026-06-20", enrolled: 110, capacity: 120 },
  { date: "2026-08-20", enrolled: 120, capacity: 120 },
  { date: "2026-09-10", enrolled: 120, capacity: 120 },
  { date: "2026-09-12", enrolled: 120, capacity: 120 },
  { date: "2026-09-22", enrolled: 120, capacity: 120 },
  { date: "2026-11-11", enrolled: 118, capacity: 120 },
  { date: "2026-11-13", enrolled: 118, capacity: 120 },
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
