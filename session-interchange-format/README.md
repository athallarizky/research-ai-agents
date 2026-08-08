# Session Interchange Format

**A portable, agent-agnostic format for saving and seeding AI agent session context.**

## The Problem

Every AI agent tool (Claude Code, Cursor, Continue, Aider, ChatGPT, Gemini, custom agents) stores session state in its own proprietary format. There is no universal interchange format. Context built in one tool cannot easily be carried into another.

This means:
- Research started in Claude Code cannot continue seamlessly in Cursor
- Insights discovered in one session must be manually re-explained to a new tool
- Multi-device workflows require manual context reconstruction
- Long-running research threads lose their thread when switching tools

## The Proposal

A **single markdown-based format** that:

1. **Any agent can read** — markdown is universal LLM training data
2. **Any agent can write** — by following instructions in this spec
3. **Humans can edit** — no special tooling required
4. **Git-friendly** — diffs, merges, history all work natively
5. **Self-describing** — structure is visible in the file itself
6. **Compact** — captures knowledge, not conversation flow

## Files

| File | Purpose |
|---|---|
| [`SPEC.md`](./SPEC.md) | Formal specification — schema, rules, validation |
| [`TEMPLATE.md`](./TEMPLATE.md) | Copy-paste template for new session files |
| [`REDACTION.md`](./REDACTION.md) | What to redact before saving (privacy rules) |
| [`examples/`](./examples/) | Worked examples showing the format in action |

## Quick Start (for agents)

When asked to save a session, write a markdown file using the format in [`SPEC.md`](./SPEC.md). Use [`TEMPLATE.md`](./TEMPLATE.md) as starting point. Apply redaction rules from [`REDACTION.md`](./REDACTION.md) before saving.

**File path convention:** `sessions/YYYY-MM-DD-topic-slug.md` (date at end).

**Status values:** `in-progress` | `completed` | `paused` | `abandoned`.

## Design Principles

1. **Knowledge over transcript.** Capture decisions, findings, open threads — not turn-by-turn chatter.
2. **Structured frontmatter, free-form body.** YAML metadata for machine parsing, markdown body for human/agent reading.
3. **Redaction by default.** PII (emails, paths, names, IPs) is redacted before saving, not after.
4. **One file per topic, not per session.** Multiple sessions on the same topic update the same file. Knowledge compounds; conversation fragments don't.
5. **References over duplication.** Link to source materials and deeper docs; don't copy-paste their content.
6. **Mix languages freely.** Use whatever language fits the content (Indonesian, English, technical jargon).

## Status

**Version:** 0.1.0 (draft, in active iteration)

This format is being dogfooded on this repository. Expect breaking changes until 1.0. See [`SPEC.md`](./SPEC.md) for the current schema and versioning policy.
