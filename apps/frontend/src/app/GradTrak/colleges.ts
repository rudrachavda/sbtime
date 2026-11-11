import { Colleges } from "@/lib/generated/graphql";

import collegesData from "./Onboarding/AddColleges/colleges.json";

// Display label for each UCSB undergraduate college. Labels must match the
// entries in colleges.json, which drives the college pickers.
export const COLLEGE_LABELS: Record<Colleges, string> = {
  [Colleges.LnS]: "Letters & Science",
  [Colleges.CoE]: "Engineering",
  [Colleges.Ccs]: "Creative Studies",
  [Colleges.Other]: "Other",
};

const LABEL_TO_COLLEGE = new Map(
  Object.entries(COLLEGE_LABELS).map(([college, label]) => [
    label,
    college as Colleges,
  ])
);

export const COLLEGE_OPTIONS = collegesData.colleges.map((college) => ({
  label: college,
  value: college,
}));

export const collegeFromLabel = (label: string): Colleges =>
  LABEL_TO_COLLEGE.get(label) ?? Colleges.Other;

export const labelFromCollege = (college: Colleges): string =>
  COLLEGE_LABELS[college] ?? COLLEGE_LABELS[Colleges.Other];
