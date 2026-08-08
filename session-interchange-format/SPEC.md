# Session Interchange Format — Specification

**Version:** 0.1.0
**Status:** Draft

## 1. Overview

A session interchange file (`.md`) captures the distilled knowledge of an AI agent session in a portable format. It is designed to be:

- Read by any LLM-based agent as context seeding
- Written by any LLM-based agent by following this spec
- Edited by humans with standard markdown tooling
- Stored in git with clean diffs

## 2. File Location & Naming

### 2.1 Location

```
<repo>/sessions/<filename>.md
```

`<repo>` is typically a private archive. Public references to sessions use the `session_id` (see §3) without exposing file contents.

### 2.2 Filename

```
<topic-slug>-YYYY-MM-DD.md
```

- **`topic-slug`**: kebab-case, descriptive of the topic (not the session date). Same topic across multiple dates uses the same slug.
- **`YYYY-MM-DD`**: ISO 8601 date of the most recent session captured in the file.
- **Examples:**
  - `pi-agent-core-2026-08-08.md`
  - `langgraph-workflow-patterns-2026-09-15.md`
  - `mcp-server-implementation-2026-10-02.md`

If a topic spans multiple sessions on the same day, append `-N` (e.g., `-2`) to disambiguate.

## 3. Frontmatter Schema

YAML frontmatter at the top of the file. All fields except where noted are required.

```yaml
---
session_id: <topic-slug>-<YYYY-MM-DD>      # Required. Identifier, matches filename without .md
title: <human-readable title>               # Required. Descriptive, can be longer than slug
date: <YYYY-MM-DD>                          # Required. ISO date of latest session
status: <status>                            # Required. See §3.1
agent: <agent-name-and-version>             # Required. Tool used to capture this session
tools_used: [<tool>, ...]                   # Required. List of tools/MCPs invoked during session
topics: [<topic>, ...]                      # Required. Keyword tags for discovery
duration_minutes: <integer>                 # Optional. Approximate session length
source_sessions:                            # Optional. Raw transcript references (private)
  - <uri-or-path>
related_docs:                               # Optional. Public docs that emerged from this session
  - <relative-or-absolute-path>
version: 0.1.0                              # Required. Spec version this file conforms to
---
```

### 3.1 Status Values

| Value | Meaning |
|---|---|
| `in-progress` | Active research, more sessions expected |
| `completed` | Thread concluded, no further work planned |
| `paused` | Intentionally stopped, may resume later |
| `abandoned` | Stopped without resolution; kept for reference |

### 3.2 Field Rules

- **`agent`**: Free-form string identifying the AI agent (e.g., `Claude Code (Sonnet 4.5)`, `Cursor (GPT-5)`, `Custom Pi Agent v0.3`).
- **`tools_used`**: Capabilities invoked (e.g., `[WebFetch, Bash, Read, Edit]`). MCP tools by name.
- **`topics`**: Tags for cross-referencing across sessions (e.g., `[pi-agent-core, rag, mcp]`).
- **`source_sessions`**: References to raw transcripts. **Never include paths to public repos.** Use `local://`, `claude-code://`, or omit if unsaved.
- **`related_docs`**: Paths to derived/curated docs (the public output of this session).

## 4. Body Structure

The body uses markdown headers. Section order is fixed; sections may be empty but must be present.

### 4.1 Required Sections

```markdown
# <Title>

## Context
Brief context (1-3 paragraphs): why this session happened, what triggered it, what the user wanted to achieve.

## Key Findings
- Finding 1 (concise, factual)
- Finding 2
- ...

## Notable Decisions
- Decision 1 (with brief rationale if non-obvious)
- Decision 2
- ...

## Open Threads
- [ ] Open question or future work item 1
- [ ] Open question 2
- [ ] ...

## References
- [External link 1](https://...)
- [External link 2](https://...)
```

### 4.2 Optional Sections

May be inserted between required sections in this order:

- `## Notable Exchanges` — key user/assistant exchanges that illustrate reasoning (kept short, redacted)
- `## Code Snippets` — code that emerged during the session, if useful
- `## Glossary` — terms defined in this session
- `## Methodology` — how the research was conducted (if non-obvious)

### 4.3 Section Content Rules

| Section | Voice | Tense | Length target |
|---|---|---|---|
| Context | Third-person or first-person plural | Past | 50-200 words |
| Key Findings | Declarative | Past or present | 1-2 sentences per finding |
| Notable Decisions | Declarative | Past | 1 sentence + optional rationale |
| Open Threads | Imperative or question | Future | 1 line each |
| References | N/A | N/A | List, no commentary |

## 5. Redaction Rules

**All PII and sensitive data MUST be redacted before saving.** See [`REDACTION.md`](./REDACTION.md) for the full rules. Summary:

| Pattern | Action |
|---|---|
| Email addresses | Replace with `<email-redacted>` or role-based (`user@example.com`) |
| File system paths (absolute) | Replace with `<path-redacted>` or relative-only |
| Usernames / real names | Replace with role or remove |
| IP addresses | Replace with `<ip-redacted>` |
| API keys, tokens, passwords | **Never include.** Verify absence. |
| Internal hostnames | Replace with `<host-redacted>` |
| Phone numbers | Replace with `<phone-redacted>` |

## 6. Validation Checklist

Before saving a session file, verify:

- [ ] Frontmatter present with all required fields
- [ ] `session_id` matches filename
- [ ] `date` is valid ISO 8601
- [ ] `status` is one of the four allowed values
- [ ] `version` is `0.1.0`
- [ ] All required body sections present in order
- [ ] No PII or credentials in body (run redaction check)
- [ ] References are external links only (not local paths to private files)
- [ ] Filename matches `<topic-slug>-YYYY-MM-DD.md`

## 7. Versioning

This spec uses semantic versioning:

- **MAJOR:** Breaking changes to schema (frontmatter fields, required sections)
- **MINOR:** Additive changes (new optional fields, new sections)
- **PATCH:** Clarifications, typo fixes, examples

Each session file declares which spec version it conforms to in its frontmatter `version:` field. Consumers should accept files matching their major version.

## 8. Compatibility & Migration

Files conforming to older major versions should be migrated when the format changes. Migration scripts live alongside this spec when introduced.

## 9. Future Work (non-normative)

Items under consideration for future spec versions:

- `## Insights` section for higher-order conclusions (vs raw findings)
- Schema for `glossary` entries (term + definition pairs)
- Optional `## Conversation Replay` for short illustrative transcripts
- Tooling: validator script, redactor script, .jsonl compactor
- Multi-language support (per-section `lang` attribute)

## 10. Reference Implementation

This repository is the reference implementation. Files in `examples/` conform to this spec. The author's own session archive (private) uses this format in production.
