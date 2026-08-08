#!/usr/bin/env node
// compact-claude-code.mjs — v0.1.0
// Convert a Claude Code .jsonl transcript to a session-interchange-format .md draft.
// Usage: node compact-claude-code.mjs <input.jsonl> --topic <slug> [options]
//
// Options:
//   --topic <slug>      Required. Topic slug for session_id and filename.
//   --agent <name>      Agent identifier (default: "Claude Code")
//   --date <YYYY-MM-DD> Date (default: today)
//   --out <file.md>     Output file (default: stdout)
//
// Output is a ROUGH DRAFT. Always review, redact, and edit before committing.
// Basic redaction is applied inline. Heuristics are basic; expect ~50% recall.

import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";

const { values, positionals } = parseArgs({
  options: {
    topic: { type: "string" },
    agent: { type: "string", default: "Claude Code" },
    date: { type: "string" },
    out: { type: "string" },
  },
  allowPositionals: true,
});

if (positionals.length === 0 || !values.topic) {
  console.error(
    "Usage: node compact-claude-code.mjs <input.jsonl> --topic <slug> [--agent \"...\"] [--date YYYY-MM-DD] [--out file.md]",
  );
  process.exit(2);
}

const inputFile = positionals[0];
const topic = values.topic;
const agent = values.agent;
const date = values.date || new Date().toISOString().slice(0, 10);

let raw;
try {
  raw = readFileSync(inputFile, "utf-8");
} catch (e) {
  console.error(`Error: cannot read input: ${inputFile}: ${e.message}`);
  process.exit(2);
}

// --- Parse JSONL ---
const entries = [];
for (const line of raw.split("\n")) {
  if (!line.trim()) continue;
  try {
    entries.push(JSON.parse(line));
  } catch {
    // skip malformed line
  }
}

// --- Extract user and assistant messages ---
const userMessages = [];
const assistantMessages = [];

for (const e of entries) {
  if (e.type !== "user" && e.type !== "assistant") continue;
  const msg = e.message;
  if (!msg || typeof msg !== "object") continue;
  const role = msg.role;
  const content = msg.content;

  let text = "";
  if (typeof content === "string") {
    text = content;
  } else if (Array.isArray(content)) {
    text = content
      .filter((c) => c && c.type === "text" && typeof c.text === "string")
      .map((c) => c.text)
      .join("\n");
  }

  if (!text || text.trim().length < 5) continue;
  // Skip system reminders / hooks injected content
  if (text.startsWith("<system-reminder>") || text.startsWith("<command-") || text.startsWith("<local-command")) continue;
  // Skip pure bash stdout blocks (often long, low signal)
  if (text.startsWith("<bash-")) continue;

  if (role === "user") userMessages.push(text);
  else if (role === "assistant") assistantMessages.push(text);
}

// --- Redaction patterns ---
const redactPatterns = [
  { from: /sk-ant-[a-zA-Z0-9_-]{20,}/g, to: "<key-redacted>" },
  { from: /sk-[a-zA-Z0-9]{40,}/g, to: "<key-redacted>" },
  { from: /gh[pousr]_[a-zA-Z0-9]{36,}/g, to: "<token-redacted>" },
  { from: /AKIA[A-Z0-9]{16}/g, to: "<key-redacted>" },
  { from: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, to: "<email-redacted>" },
  { from: /\/data\/data\/com\.termux\/files\/home[\S]*/g, to: "<path-redacted>" },
  { from: /\/home\/[A-Za-z0-9._-]+[\/\S]*/g, to: "<path-redacted>" },
  { from: /\/Users\/[A-Za-z0-9._-]+[\/\S]*/g, to: "<path-redacted>" },
];

function redact(text) {
  let r = text;
  for (const p of redactPatterns) {
    r = r.replace(p.from, p.to);
  }
  return r;
}

// --- Heuristic extraction ---
const findings = [];
const decisions = [];
const openThreads = [];
const references = new Set();

const decisionKeywords =
  /\b(decision|decided|use|chose|pilih|gunakan|pakai|adopt|go with|landed on|resolved)\b/i;
const findingStopwords =
  /^(todo|tbd|example|note:|warning:)/i;

for (const msg of assistantMessages) {
  for (const line of msg.split("\n")) {
    const m = line.match(/^\s*[-*]\s+(.+)/);
    if (!m) continue;
    const text = m[1].trim().replace(/\*\*/g, "");
    if (text.length < 15 || text.length > 300) continue;
    if (findingStopwords.test(text)) continue;

    if (decisionKeywords.test(text)) {
      decisions.push(text);
    } else {
      findings.push(text);
    }
  }

  // Extract URLs (public references)
  const urlRegex = /https?:\/\/[^\s)"<>\]]+(?<![.,);:!])/g;
  const matches = [...msg.matchAll(urlRegex)];
  for (const m of matches) {
    // Skip example URLs
    if (m[0].includes("example.com") || m[0].includes("localhost")) continue;
    references.add(m[0]);
  }
}

// Open threads from last few user messages (likely questions / TODOs)
for (const msg of userMessages.slice(-3)) {
  for (const line of msg.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length < 10 || trimmed.length > 200) continue;
    if (/\?\s*$/.test(trimmed) || /\b(next|todo|later)\b/i.test(trimmed)) {
      openThreads.push(`[ ] ${trimmed}`);
    }
  }
}

// First substantial user message → Context
const contextMsg =
  userMessages.find((m) => m.length > 30) || userMessages[0] || "(no context captured)";
const context = redact(contextMsg.slice(0, 800));

// --- Compose output ---
const toolsUsedGuess = guessToolsUsed(raw);

const out = `---
session_id: ${topic}-${date}
title: ${topic}
date: ${date}
status: in-progress
agent: ${agent}
tools_used: [${toolsUsedGuess.join(", ")}]
topics: [${topic}]
version: 0.1.0
---

# ${topic}

<!-- GENERATED DRAFT — review, edit, redact, and remove placeholders before committing. -->

## Context

${context}

## Key Findings

${dedupe(findings).slice(0, 15).map((f) => `- ${redact(f)}`).join("\n") || "- TODO: extract findings"}

## Notable Decisions

${dedupe(decisions).slice(0, 10).map((d) => `- ${redact(d)}`).join("\n") || "- TODO: extract decisions"}

## Open Threads

${dedupe(openThreads).slice(0, 8).join("\n") || "- [ ] TODO: extract open questions"}

## References

${[...references].slice(0, 10).map((r) => `- ${r}`).join("\n") || "- TODO: add references"}
`;

if (values.out) {
  writeFileSync(values.out, out);
  console.error(`Wrote: ${values.out}`);
  console.error("REVIEW AND EDIT before committing. Apply redaction rules from REDACTION.md.");
} else {
  process.stdout.write(out);
}

// ---------- helpers ----------

function dedupe(arr) {
  // Case-insensitive dedupe, preserve order
  const seen = new Set();
  const result = [];
  for (const item of arr) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function guessToolsUsed(raw) {
  const tools = new Set();
  if (/"name":\s*"Read"/.test(raw)) tools.add("Read");
  if (/"name":\s*"Write"/.test(raw)) tools.add("Write");
  if (/"name":\s*"Edit"/.test(raw)) tools.add("Edit");
  if (/"name":\s*"Bash"/.test(raw)) tools.add("Bash");
  if (/"name":\s*"WebFetch"/.test(raw)) tools.add("WebFetch");
  if (/"name":\s*"WebSearch"/.test(raw)) tools.add("WebSearch");
  if (/"name":\s*"Glob"/.test(raw)) tools.add("Glob");
  if (/"name":\s*"Grep"/.test(raw)) tools.add("Grep");
  if (/"name":\s*"Task"/.test(raw)) tools.add("Task");
  return [...tools];
}
