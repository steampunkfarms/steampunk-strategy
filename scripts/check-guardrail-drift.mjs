#!/usr/bin/env node

/**
 * Guardrail Drift Checker
 *
 * Compares lib/voice-engine/guardrails.ts between Postmaster and Studiolo.
 * Exits 0 if files are identical (SHA-256 match), exits 1 if they differ.
 *
 * Environment variables:
 *   PROJECTS_BASE - override base path (default: /Users/ericktronboll/Projects/)
 *
 * In GitHub Actions the repos are checked out as siblings under $GITHUB_WORKSPACE,
 * so set PROJECTS_BASE to $GITHUB_WORKSPACE/ when running in CI.
 */

import { readFileSync } from "fs";
import { createHash } from "crypto";
import { resolve } from "path";

const base = process.env.PROJECTS_BASE || "/Users/ericktronboll/Projects/";

const postmasterPath = resolve(
  base,
  "steampunk-postmaster/lib/voice-engine/guardrails.ts"
);
const studioloPath = resolve(
  base,
  "steampunk-studiolo/lib/voice-engine/guardrails.ts"
);

function sha256(filePath) {
  const content = readFileSync(filePath);
  return createHash("sha256").update(content).digest("hex");
}

console.log("Guardrail Drift Check");
console.log("=====================");
console.log(`Postmaster: ${postmasterPath}`);
console.log(`Studiolo:   ${studioloPath}`);
console.log();

let postmasterHash, studioloHash;

try {
  postmasterHash = sha256(postmasterPath);
} catch (err) {
  console.error(`ERROR: Cannot read Postmaster guardrails: ${err.message}`);
  process.exit(1);
}

try {
  studioloHash = sha256(studioloPath);
} catch (err) {
  console.error(`ERROR: Cannot read Studiolo guardrails: ${err.message}`);
  process.exit(1);
}

console.log(`Postmaster SHA-256: ${postmasterHash}`);
console.log(`Studiolo   SHA-256: ${studioloHash}`);
console.log();

if (postmasterHash === studioloHash) {
  console.log("PASS: Guardrail files are identical.");
  process.exit(0);
} else {
  console.error(
    "FAIL: Guardrail files have diverged! Postmaster and Studiolo guardrails.ts must stay in sync."
  );
  process.exit(1);
}
