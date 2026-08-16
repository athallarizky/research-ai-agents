# research-ai-agents

Personal research notes on AI agents — architectures, frameworks, tooling, and experiments.

## For AI Agents

**Read [`AGENTS.md`](./AGENTS.md) first.** It contains everything you need to know about navigating, extending, and contributing to this repo.

## For Humans

This repo is a personal knowledge base of research on AI agent tooling. Each topic is its own directory. Browse the index below, or jump to a topic.

## Topic Index

| Topic | Summary | Date |
|-------|---------|------|
| [pi-agent-core](./pi-agent-core) | Pi toolkit (earendil-works/pi) — architecture, comparisons vs LangChain/LangGraph, code examples, MCP and RAG integration patterns | 2026-08-08 |
| [session-interchange-format](./session-interchange-format) | Portable format for saving and seeding AI agent session context across tools (Claude Code, Cursor, Continue, custom agents) | 2026-08-08 |
| [ai-terminology-map](./ai-terminology-map) | Taxonomy of AI terms — concept vs technique vs pattern vs methodology vs architecture vs protocol vs artifact; the "X engineering" stack (prompt → context → harness → loop → graph) | 2026-08-16 |

## Tools

The `session-interchange-format/` topic ships with optional tools (zero dependencies, Node.js + bash). They are conveniences — files remain valid without them.

### Validator

Check a session file conforms to spec v0.1.0.

```bash
node session-interchange-format/tools/validate.mjs path/to/session.md
```

Exit 0 = valid. Exit 1 = invalid (errors listed). Exit 2 = usage error.

### PII Scanner

Scan for emails, paths, IPs, and secret patterns before committing.

```bash
node session-interchange-format/tools/redact-scan.mjs path/to/session.md
```

Exit 0 = clean. Exit 1 = potential PII found (review required).

### Scaffolder

Create a new session file from `TEMPLATE.md`.

```bash
./session-interchange-format/tools/new-session.sh <topic-slug> [YYYY-MM-DD]
```

### Claude Code Compactor

Convert a Claude Code `.jsonl` transcript to a session draft (review and edit before committing).

```bash
node session-interchange-format/tools/compact-claude-code.mjs \
  ~/.claude/projects/.../session.jsonl \
  --topic <slug> --date YYYY-MM-DD \
  --out sessions/<slug>-<date>.md
```

See [`session-interchange-format/tools/README.md`](./session-interchange-format/tools/README.md) for details, options, and known limitations.

## Conventions

- Each topic is its own directory at the repo root: `<topic-name>/`.
- Each topic directory has a `README.md` as the entry point; supporting notes, diagrams, and code live alongside it.
- Cross-link between topics with relative paths.
- Name directories in `kebab-case`. No numeric prefixes on filenames.
- Mix languages freely (Indonesian, English, jargon).

## Related

- **Sister repo (private):** `research-ai-agents-sessions` — raw session archives using the format specified in [`session-interchange-format/`](./session-interchange-format).
- **License:** MIT
