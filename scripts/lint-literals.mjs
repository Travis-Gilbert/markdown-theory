#!/usr/bin/env node
/**
 * The no-literals oracle (G1/G2 acceptance).
 *
 * galley/react and galley/css are pure projections of the token engine: they
 * reference var(--gy-*) and never a color, size, or spacing literal. The only
 * permitted literal is the hairline, which itself arrives as var(--gy-hairline).
 *
 * This script greps those two surfaces for hex colors, px sizes, and rem
 * literals and fails the build if any leak in. It is deliberately strict; a
 * finding is a design bug, not a style nit.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const ROOTS = ["packages/galley/src/react", "packages/galley/src/css"];
const EXTS = new Set([".ts", ".tsx", ".css"]);

const PATTERNS = [
  { name: "hex color", re: /#[0-9a-fA-F]{3,8}\b/ },
  { name: "px size", re: /\b\d*\.?\d+px\b/ },
  { name: "rem literal", re: /\b\d*\.?\d+rem\b/ },
];

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return; // surface not created yet
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (EXTS.has(extname(full))) yield full;
  }
}

/** Lines allowed to hold what looks like a literal. */
function isExempt(line) {
  const t = line.trim();
  if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) return true;
  // The hairline is the single permitted literal; it must be a token reference.
  if (t.includes("--gy-hairline")) return true;
  return false;
}

let violations = 0;
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      if (isExempt(line)) return;
      for (const { name, re } of PATTERNS) {
        if (re.test(line)) {
          violations++;
          console.error(`${file}:${i + 1}  ${name}: ${line.trim()}`);
        }
      }
    });
  }
}

if (violations > 0) {
  console.error(`\nlint:literals FAILED -- ${violations} literal(s) in a token-only surface.`);
  process.exit(1);
}
console.log("lint:literals OK -- galley/react and galley/css hold no color/size/spacing literals.");
