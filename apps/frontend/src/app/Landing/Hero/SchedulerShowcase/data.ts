// A fixed snapshot of real UCSB classes (Fall 2024, lecture section 0100),
// read once from the production catalog on 2026-11-13. The showcase never
// calls the API; edit this file to change what it shows.

export const SHOWCASE_TERM = "Fall 2024";

// Monday = 0 ... Friday = 4
export type Weekday = 0 | 1 | 2 | 3 | 4;

export interface ShowcaseMeeting {
  days: Weekday[];
  /** 24-hour "HH:MM" */
  start: string;
  end: string;
}

export interface ShowcaseClass {
  subject: string;
  courseNumber: string;
  title: string;
  units: number;
  /** A @repo/theme color name; blocks use var(--{color}-500) like the Scheduler */
  color: "blue" | "green" | "orange" | "purple";
  meetings: ShowcaseMeeting[];
}

// In the order they're added during the animation
export const SHOWCASE_CLASSES: ShowcaseClass[] = [
  {
    subject: "CMPSC",
    courseNumber: "16",
    title: "Problem Solving with Computers I",
    units: 4,
    color: "blue",
    meetings: [{ days: [1, 3], start: "12:30", end: "13:45" }],
  },
  {
    subject: "MATH",
    courseNumber: "4A",
    title: "Linear Algebra with Applications",
    units: 4,
    color: "green",
    meetings: [{ days: [0, 2, 4], start: "13:00", end: "13:50" }],
  },
  {
    subject: "PSTAT",
    courseNumber: "120A",
    title: "Probability and Statistics",
    units: 4,
    color: "orange",
    meetings: [{ days: [0, 2], start: "14:00", end: "15:15" }],
  },
  {
    subject: "WRIT",
    courseNumber: "2",
    title: "Academic Writing",
    units: 5,
    color: "purple",
    meetings: [{ days: [0, 2], start: "11:00", end: "12:50" }],
  },
];

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

// Hours shown on the week grid: 9am up to 5pm
export const FIRST_HOUR = 9;
export const LAST_HOUR = 17;
