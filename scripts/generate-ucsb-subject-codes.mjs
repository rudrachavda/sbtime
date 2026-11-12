#!/usr/bin/env node
// Regenerate the official spelling of UCSB subject codes that contain spaces
// ("AS AM", "CH E"). The app stores subjects without spaces ("ASAM"); the
// frontend uses this map to show them the way GOLD does.
//
//   node scripts/generate-ucsb-subject-codes.mjs
//
// Reads UCSB_API_KEY from .env and writes
// apps/frontend/src/lib/subject-codes.json.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "apps/frontend/src/lib/subject-codes.json");

const apiKey = /^UCSB_API_KEY=(.*)$/m
  .exec(readFileSync(join(root, ".env"), "utf8"))?.[1]
  ?.trim();
if (!apiKey) {
  console.error("UCSB_API_KEY is not set in .env.");
  process.exit(1);
}

const response = await fetch("https://api.ucsb.edu/students/lookups/v1/subjects", {
  headers: { accept: "application/json", "ucsb-api-key": apiKey },
});
if (!response.ok) throw new Error(`Lookups request failed with HTTP ${response.status}`);

const codes = {};
for (const subject of await response.json()) {
  // Collapse runs of spaces: "ART  CS" is shown as "ART CS".
  const official = (subject.subjectCode ?? "").trim().replace(/\s+/g, " ");
  const stored = official.replace(/\s+/g, "").toUpperCase();
  if (official && official !== stored) codes[stored] = official;
}

const sorted = Object.fromEntries(Object.entries(codes).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(output, `${JSON.stringify(sorted, null, 2)}\n`);
console.log(`Wrote ${Object.keys(sorted).length} subject codes to ${output.replace(`${root}/`, "")}.`);
