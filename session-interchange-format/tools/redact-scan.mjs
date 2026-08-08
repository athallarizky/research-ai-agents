#!/usr/bin/env node
// redact-scan.mjs — v0.1.0
// Scan a session-interchange-format file for potential PII patterns.
// Usage: node redact-scan.mjs <file.md>
// Exit 0: clean. Exit 1: potential PII found (review required). Exit 2: usage error.
// This tool scans and reports; it does NOT modify files. Redaction is manual.

import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node redact-scan.mjs <file.md>");
  process.exit(2);
}

let content;
try {
  content = readFileSync(file, "utf-8");
} catch (e) {
  console.error(`Error: cannot read file: ${file}: ${e.message}`);
  process.exit(2);
}

// Patterns to flag. Order matters: more specific patterns first.
const patterns = [
  { name: "Anthropic API key", regex: /sk-ant-[a-zA-Z0-9_-]{20,}/g, severity: "critical" },
  { name: "OpenAI API key", regex: /sk-[a-zA-Z0-9]{40,}/g, severity: "critical" },
  { name: "GitHub token", regex: /gh[pousr]_[a-zA-Z0-9]{36,}/g, severity: "critical" },
  { name: "AWS access key", regex: /AKIA[A-Z0-9]{16}/g, severity: "critical" },
  { name: "Slack token", regex: /xox[baprs]-[a-zA-Z0-9-]{10,}/g, severity: "critical" },
  { name: "Bearer token", regex: /Bearer\s+[a-zA-Z0-9._-]{20,}/g, severity: "critical" },
  { name: "JWT token", regex: /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g, severity: "critical" },
  { name: "Email", regex: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, severity: "warn" },
  {
    name: "Absolute home path",
    regex: /(\/home\/[a-z_][a-z0-9_-]*|\/Users\/[A-Za-z][A-Za-z0-9_-]*|\/data\/data\/com\.termux\/files\/home)\/[A-Za-z0-9._\/-]+/g,
    severity: "warn",
  },
  {
    name: "IPv4 address",
    regex: /\b(?!0\.0\.0\.0|127\.0\.0\.1|255\.255\.255\.255|169\.254\.169\.254)(?:\d{1,3}\.){3}\d{1,3}\b/g,
    severity: "warn",
  },
  {
    name: "Phone (international)",
    regex: /\+\d{1,3}[\s-]?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}/g,
    severity: "warn",
  },
];

// Values that are safe and should not be flagged even if they match.
const allowlist = [
  "user@example.com",
  "alice@example.com",
  "alice@company.com",
  "bob@example.com",
  "example.com",
  "127.0.0.1",
  "0.0.0.0",
  "255.255.255.255",
  "localhost",
  "<email-redacted>",
  "<path-redacted>",
  "<ip-redacted>",
  "<phone-redacted>",
  "<host-redacted>",
  "<key-redacted>",
  "<token-redacted>",
];

const findings = [];
const lines = content.split("\n");

// Track state to allow certain sections (References, code blocks marked as examples)
let inReferences = false;

lines.forEach((line, idx) => {
  if (/^##\s+/.test(line)) {
    inReferences = /^##\s+References\s*$/.test(line);
    return;
  }

  // In References section, allow URLs (which may contain @ or look like paths)
  if (inReferences) return;

  for (const { name, regex, severity } of patterns) {
    regex.lastIndex = 0;
    const matches = line.matchAll(regex);
    for (const m of matches) {
      const val = m[0];
      // Allowlist check
      if (allowlist.some((a) => val.includes(a) || a.includes(val))) continue;
      // Code-with-example marker: line or value contains <example> or placeholder
      if (line.includes("<example>") || line.includes("placeholder")) continue;
      findings.push({ line: idx + 1, name, value: val, severity, context: line.trim().slice(0, 100) });
    }
  }
});

if (findings.length === 0) {
  console.log(`PASS: ${file}: no PII patterns detected`);
  process.exit(0);
}

const critical = findings.filter((f) => f.severity === "critical");
const warnings = findings.filter((f) => f.severity === "warn");

if (critical.length > 0) {
  console.error(`CRITICAL: ${file}: ${critical.length} likely secret(s) found`);
  for (const f of critical) {
    console.error(`  L${f.line} [${f.name}]: ${f.value}`);
    console.error(`    context: ${f.context}`);
  }
  console.error("");
}

if (warnings.length > 0) {
  console.error(`WARN: ${file}: ${warnings.length} potential PII pattern(s)`);
  for (const f of warnings) {
    console.error(`  L${f.line} [${f.name}]: ${f.value}`);
  }
}

console.error("");
console.error("Review and redact before committing. See REDACTION.md for rules.");
process.exit(critical.length > 0 ? 1 : warnings.length > 0 ? 1 : 0);
