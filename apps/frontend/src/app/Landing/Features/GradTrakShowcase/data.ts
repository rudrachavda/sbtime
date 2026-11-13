// A Computer Science (Engineering) plan for the GradTrak showcase. Courses
// and requirement groups follow the real 2026-27 requirements in production
// (planrequirements, read 2026-11-13); the plan itself is illustrative.

export const PLAN_MAJOR = "Computer Science";
export const PLAN_CATALOG_YEAR = "2026-27";

export type RequirementId = "cs" | "math" | "upper";

export const REQUIREMENTS: {
  id: RequirementId;
  label: string;
  total: number;
}[] = [
  { id: "cs", label: "Computer Science preparation", total: 6 },
  { id: "math", label: "Mathematics and Statistics", total: 6 },
  { id: "upper", label: "Upper-division required", total: 3 },
];

export interface PlanCourse {
  code: string;
  units: number;
  /** The requirement it counts toward (undefined: a GE or elective) */
  requirement?: RequirementId;
}

export interface PlanQuarter {
  name: string;
  courses: PlanCourse[];
}

// Two years, one row per year; courses appear in this order.
export const PLAN_YEARS: PlanQuarter[][] = [
  [
    {
      name: "Fall 2026",
      courses: [
        { code: "CMPSC 16", units: 4, requirement: "cs" },
        { code: "MATH 3A", units: 4, requirement: "math" },
        { code: "WRIT 1", units: 4 },
      ],
    },
    {
      name: "Winter 2027",
      courses: [
        { code: "CMPSC 24", units: 4, requirement: "cs" },
        { code: "MATH 3B", units: 4, requirement: "math" },
      ],
    },
    {
      name: "Spring 2027",
      courses: [
        { code: "CMPSC 32", units: 4, requirement: "cs" },
        { code: "MATH 4A", units: 4, requirement: "math" },
      ],
    },
  ],
  [
    {
      name: "Fall 2027",
      courses: [
        { code: "CMPSC 64", units: 4, requirement: "cs" },
        { code: "MATH 4B", units: 4, requirement: "math" },
      ],
    },
    {
      name: "Winter 2028",
      courses: [
        { code: "CMPSC 41", units: 4, requirement: "cs" },
        { code: "PSTAT 120A", units: 4, requirement: "math" },
      ],
    },
    {
      name: "Spring 2028",
      courses: [
        { code: "CMPSC 42", units: 4, requirement: "cs" },
        { code: "MATH 6A", units: 4, requirement: "math" },
      ],
    },
  ],
];
