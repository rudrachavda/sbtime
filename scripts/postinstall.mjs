#!/usr/bin/env node
/**
 * Applies the fixes in patches/ after `npm install`, like plain
 * `patch-package`, except that it skips when a patched package isn't
 * installed. Vercel installs each service on its own, so the frontend's
 * install has no graphql-modules (a backend package), and patch-package
 * would fail the build. When every patched package is present, a patch that
 * fails to apply still fails the install.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const patchDir = "patches";
const patches = existsSync(patchDir)
  ? readdirSync(patchDir).filter((file) => file.endsWith(".patch"))
  : [];

// "graphql-modules+3.0.0.patch" -> "graphql-modules";
// "@scope+name+1.0.0.patch" -> "@scope/name".
const packageOf = (file) => {
  const parts = file.replace(/\.patch$/, "").split("+");
  parts.pop();
  return parts.join("/");
};

const missing = patches
  .map(packageOf)
  .filter((name) => !existsSync(join("node_modules", name)));

if (patches.length === 0) process.exit(0);

if (missing.length > 0) {
  console.log(
    `patch-package skipped: not installed here (${missing.join(", ")})`
  );
  process.exit(0);
}

const result = spawnSync("npx", ["patch-package"], { stdio: "inherit" });
process.exit(result.status ?? 1);
