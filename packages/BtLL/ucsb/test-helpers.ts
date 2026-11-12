import { init } from "../src/interpreter";
import type { Data } from "../src/types";

export interface Result {
  result: Data<boolean>;
  description: Data<string>;
  requirements?: Data<Result[]>;
}

/** A planned course, shaped like GradTrak's course adapter output. */
export const course = (
  name: string,
  tags: string[] = [],
  units = 4,
  universityRequirement = ""
) => {
  const [subject, ...rest] = name.split(" ");
  return {
    subject: { data: subject, type: "string" },
    number: { data: rest.join(" "), type: "string" },
    units: { data: units, type: "number" },
    universityRequirement: { data: universityRequirement, type: "string" },
    breadthRequirements: { data: tags, type: "List<string>" },
    languageLevel: { data: "", type: "string" },
  };
};

export type TestCourse = ReturnType<typeof course>;

/** Several 4-unit courses at once. */
export const courses = (...names: string[]) =>
  names.map((name) => course(name));

/** Runs a requirement program against a plan holding `planned`. */
export const run = (code: string, planned: TestCourse[], extraUnits = 0) => {
  const units = planned.reduce((sum, c) => sum + c.units.data, 0) + extraUnits;
  const plan = {
    units: { data: units, type: "number" },
    columns: { data: [], type: "List<Column>" },
    allCourses: { data: planned, type: "List<Course>" },
  };
  const variables = new Map<string, Data<unknown>>([
    ["this", { data: plan, type: "Plan" }],
    ["columns", { data: [], type: "List<Column>" }],
  ]);
  return init(code, variables, {}) as Result[];
};

/** Every requirement's result, nested ones included, keyed by description. */
export const byName = (results: Result[]) => {
  const all = new Map<string, boolean>();
  const walk = (list: Result[]) => {
    for (const r of list) {
      all.set(r.description.data, r.result.data);
      if (r.requirements) walk(r.requirements.data);
    }
  };
  walk(results);
  return all;
};

/** Top-level results as [description, met] pairs. */
export const summary = (results: Result[]) =>
  results.map((r) => [r.description.data, r.result.data]);
