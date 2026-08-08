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

## Conventions

- Each topic is its own directory at the repo root: `<topic-name>/`.
- Each topic directory has a `README.md` as the entry point; supporting notes, diagrams, and code live alongside it.
- Cross-link between topics with relative paths.
- Name directories in `kebab-case`. No numeric prefixes on filenames.
- Mix languages freely (Indonesian, English, jargon).

## Related

- **Sister repo (private):** `research-ai-agents-sessions` — raw session archives using the format specified in [`session-interchange-format/`](./session-interchange-format).
- **License:** MIT
