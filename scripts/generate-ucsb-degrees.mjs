#!/usr/bin/env node
// Regenerate GradTrak's list of UCSB majors and minors from the Registrar's
// lookup tables (Student Record Code Lookups API).
//
//   node scripts/generate-ucsb-degrees.mjs
//
// Reads UCSB_API_KEY from .env and writes
// apps/frontend/src/app/GradTrak/degree-programs.json.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(
  root,
  "apps/frontend/src/app/GradTrak/degree-programs.json"
);

const env = readFileSync(join(root, ".env"), "utf8");
const apiKey = /^UCSB_API_KEY=(.*)$/m.exec(env)?.[1]?.trim();
if (!apiKey) {
  console.error("UCSB_API_KEY is not set in .env.");
  process.exit(1);
}

const get = async (path) => {
  const response = await fetch(
    `https://api.ucsb.edu/students/lookups/v1/${path}`,
    {
      headers: { accept: "application/json", "ucsb-api-key": apiKey },
    }
  );
  if (!response.ok) {
    throw new Error(
      `Lookups request for ${path} failed with HTTP ${response.status}`
    );
  }
  return response.json();
};

// Undergraduate colleges only, to start.
const COLLEGES = {
  "L&S": "Letters & Science",
  ENGR: "Engineering",
  CRST: "Creative Studies",
};

const clean = (value) => (value ?? "").trim().replace(/\s+/g, " ");

const [majors, minors, degreeCombinations] = await Promise.all([
  get("majors"),
  get("minors"),
  get("objmajemps"),
]);

// The majors table still lists retired majors and internal records ("PROFILE
// for Degree Audit"). Keep only majors that lead to an active undergraduate
// degree.
const degreeMajorCodes = new Set(
  degreeCombinations
    .filter(
      (combination) =>
        !combination.inactive &&
        combination.obtainDegree === "Y" &&
        clean(combination.objLevelCode) === "U"
    )
    .map((combination) => clean(combination.majorCode))
);

// Pre-majors and "Undeclared" are statuses on the way to a major, not degrees
// to plan toward.
const undergradMajors = majors
  .filter(
    (major) => !major.inactive && degreeMajorCodes.has(clean(major.majorCode))
  )
  .map((major) => ({
    name: clean(major.majorTranslation),
    college: COLLEGES[clean(major.collegeCode)],
  }))
  .filter(
    ({ name, college }) =>
      college && name && !/^pre-/i.test(name) && !/^undeclared/i.test(name)
  );

// The same major can be offered by more than one college (Computer Science
// in Engineering and in Creative Studies); name the college in those cases.
const collegesByName = new Map();
for (const { name, college } of undergradMajors) {
  collegesByName.set(
    name,
    new Set([...(collegesByName.get(name) ?? []), college])
  );
}

const majorNames = [
  ...new Set(
    undergradMajors.map(({ name, college }) =>
      collegesByName.get(name).size > 1 ? `${name} (${college})` : name
    )
  ),
].sort((a, b) => a.localeCompare(b));

const minorNames = [
  ...new Set(
    minors
      .filter((minor) => !minor.inactive)
      .map((minor) => clean(minor.minorTranslation))
      .filter(Boolean)
  ),
].sort((a, b) => a.localeCompare(b));

const degrees = {
  majors: majorNames,
  minors: minorNames,
  all: [...new Set([...majorNames, ...minorNames])].sort((a, b) =>
    a.localeCompare(b)
  ),
  // Berkeley-only categories, kept so the shape the pickers expect stays the same.
  certificates: [],
  simultaneousDegrees: [],
  summerMinors: [],
};

writeFileSync(output, `${JSON.stringify(degrees, null, 2)}\n`);
console.log(
  `Wrote ${majorNames.length} majors and ${minorNames.length} minors to ${output.replace(`${root}/`, "")}.`
);
