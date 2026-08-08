#!/usr/bin/env node
// validate.mjs — v0.1.0
// Validate a session-interchange-format file against spec.
// Usage: node validate.mjs <file.md>
// Exit 0: valid. Exit 1: validation errors. Exit 2: usage error.

import { readFileSync } from "node:fs";
import { basename } from "node:path";

const SPEC_VERSION = "0.1.0";
const REQUIRED_FM_FIELDS = [
  "session_id",
  "title",
  "date",
  "status",
  "agent",
  "tools_used",
  "topics",
  "version",
];
const VALID_STATUS = ["in-progress", "completed", "paused", "abandoned"];
const REQUIRED_SECTIONS = [
  "## Context",
  "## Key Findings",
  "## Notable Decisions",
  "## Open Threads",
  "## References",
];
// Required sections must appear in this relative order. Optional sections
// (Notable Exchanges, Code Snippets, Glossary, Methodology) may appear in
// their designated slots but are not enforced.
const SECTION_ORDER = [
  "## Context",
  "## Key Findings",
  "## Notable Decisions",
  "## Open Threads",
  "## References",
];

const file = process.argv[2];
if (!file) {
  console.error("Usage: node validate.mjs <file.md>");
  process.exit(2);
}

let content;
try {
  content = readFileSync(file, "utf-8");
} catch (e) {
  console.error(`Error: cannot read file: ${file}: ${e.message}`);
  process.exit(2);
}

const errors = [];

// --- Frontmatter extraction ---
const fmMatch = content.match(/^---\r?\n([\s\S]+?)\r?\n---\r?\n/);
if (!fmMatch) {
  errors.push("Missing YAML frontmatter (file must start with --- ... ---)");
} else {
  const fmText = fmMatch[1];
  const fields = parseSimpleYaml(fmText);

  // Required field presence
  for (const f of REQUIRED_FM_FIELDS) {
    if (!(f in fields)) {
      errors.push(`Frontmatter missing required field: ${f}`);
    } else if (isEmptyValue(fields[f])) {
      errors.push(`Frontmatter field is empty: ${f}`);
    }
  }

  // session_id matches filename
  if (fields.session_id && typeof fields.session_id === "string") {
    const expected = basename(file, ".md");
    if (fields.session_id !== expected) {
      errors.push(
        `session_id "${fields.session_id}" does not match filename "${expected}"`,
      );
    }
  }

  // date format
  if (fields.date && typeof fields.date === "string") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.date)) {
      errors.push(`date "${fields.date}" is not YYYY-MM-DD`);
    } else {
      const d = new Date(fields.date);
      if (isNaN(d.getTime())) {
        errors.push(`date "${fields.date}" is not a valid date`);
      }
    }
  }

  // status enum
  if (fields.status && !VALID_STATUS.includes(fields.status)) {
    errors.push(
      `status "${fields.status}" not in: ${VALID_STATUS.join(", ")}`,
    );
  }

  // version match
  if (fields.version && fields.version !== SPEC_VERSION) {
    errors.push(
      `version "${fields.version}" does not match spec v${SPEC_VERSION}`,
    );
  }
}

// --- Body sections ---
const bodyStart = fmMatch ? fmMatch[0].length : 0;
const body = content.slice(bodyStart);

// H1 title
if (!/^#\s+.+/m.test(body)) {
  errors.push("Missing top-level title (H1: # Title)");
}

// Collect all H2 headings in order
const headings = [];
for (const line of body.split("\n")) {
  const m = line.match(/^##\s+(.+?)\s*$/);
  if (m) headings.push(`## ${m[1]}`);
}

// Required section presence
for (const req of REQUIRED_SECTIONS) {
  if (!headings.includes(req)) {
    errors.push(`Missing required section: ${req}`);
  }
}

// Required section relative order
const presentRequired = headings.filter((h) => SECTION_ORDER.includes(h));
let lastIdx = -1;
for (const sec of presentRequired) {
  const idx = SECTION_ORDER.indexOf(sec);
  if (idx < lastIdx) {
    errors.push(
      `Section "${sec}" appears out of order (expected before "${SECTION_ORDER[lastIdx]}")`,
    );
    break;
  }
  lastIdx = idx;
}

// --- Output ---
if (errors.length > 0) {
  console.error(`FAIL: ${file} (${errors.length} error${errors.length === 1 ? "" : "s"})`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`PASS: ${file} (spec v${SPEC_VERSION})`);
process.exit(0);

// ---------- helpers ----------

function parseSimpleYaml(text) {
  // Minimal YAML parser. Supports:
  //   key: value
  //   key: "quoted value"
  //   key: [a, b, c]
  //   key:
  //     - item
  //     - item
  // Does NOT support nested objects, multiline strings, anchors, etc.
  const fields = {};
  let currentKey = null;
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const kvMatch = line.match(/^([a-z_]+):\s*(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1];
      const rawVal = kvMatch[2].trim();
      if (rawVal === "") {
        fields[key] = [];
        currentKey = key;
      } else if (rawVal.startsWith("[")) {
        const inner = rawVal.replace(/^\[|\]$/g, "");
        fields[key] = inner
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""))
          .filter((s) => s.length > 0);
        currentKey = null;
      } else {
        fields[key] = rawVal.replace(/^["']|["']$/g, "");
        currentKey = null;
      }
    } else if (line.startsWith("  - ") && currentKey) {
      const item = line.slice(4).trim().replace(/^["']|["']$/g, "");
      if (Array.isArray(fields[currentKey])) {
        fields[currentKey].push(item);
      }
    }
  }
  return fields;
}

function isEmptyValue(v) {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  return false;
}
