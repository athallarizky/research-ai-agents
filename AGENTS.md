# AGENTS.md

Single source of truth for any AI agent working in this repository.

If you are an LLM-based agent (Claude Code, Cursor, Continue, Aider, Codex, custom agent, etc.) reading this for the first time: **read this file completely before doing anything else.**

## Repository Identity

**`research-ai-agents`** — Personal research notes on AI agents: architectures, frameworks, tooling, and experiments.

- **Author:** athallarizky (public identity)
- **Visibility:** Public open-source
- **License:** MIT
- **Sister repo (private):** `research-ai-agents-sessions` — raw session archives. Not in this repo.

## How to Navigate

```
research-ai-agents/
├── README.md                          ← entry point for humans
├── AGENTS.md                          ← entry point for agents (this file)
├── <topic>/                           ← one folder per research topic
│   ├── README.md                      ← topic index
│   └── *.md                           ← notes, diagrams, code
└── session-interchange-format/        ← meta-spec for session portability
```

### Active Topics

| Topic | What it covers |
|---|---|
| [`pi-agent-core/`](./pi-agent-core) | Pi toolkit (earendil-works/pi) — architecture, comparisons, code examples |
| [`session-interchange-format/`](./session-interchange-format) | Portable format for saving/seeding AI agent session context |

### Topic Conventions

- One directory per topic, `kebab-case` name
- Each topic has a `README.md` as the entry point
- Supporting notes, diagrams, code live alongside
- Cross-link between topics with relative paths
- No numeric prefixes on filenames

## Languages

Mix freely. Use whatever fits the content (Indonesian, English, technical jargon). Don't translate for consistency.

## Session Saving Protocol

When the user asks to save the current session, or when a session is about to end:

1. **Read the spec:** [`session-interchange-format/SPEC.md`](./session-interchange-format/SPEC.md)
2. **Copy the template:** [`session-interchange-format/TEMPLATE.md`](./session-interchange-format/TEMPLATE.md)
3. **Apply redaction rules:** [`session-interchange-format/REDACTION.md`](./session-interchange-format/REDACTION.md) — **mandatory, no exceptions**
4. **Save location:** Private repo (`research-ai-agents-sessions`), path `sessions/<topic-slug>-YYYY-MM-DD.md`
5. **Update topic file:** If this is the first session on a topic, create the topic directory in the public repo. If continuing, update the existing topic docs.

### What Goes in the Public Repo vs Private Repo

| Content | Repo |
|---|---|
| Curated research notes (knowledge) | **Public** (`research-ai-agents`) |
| Topic README, supporting docs | **Public** |
| Compact session file (redacted) | **Private** (`research-ai-agents-sessions`) |
| Raw `.jsonl` transcripts | **Private**, never shared |
| Example session files | **Public** (in `session-interchange-format/examples/`), fully redacted/sanitized |

## Git Workflow

Repo conventions:

- **Conventional commits** (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, etc.) — community standard, keeps history readable
- **Audit before push.** Scan diffs for credentials, PII, secrets, `.env` files. Block if found.

For AI agents working in this repo:

- **Never auto-commit or auto-push.** Stage and stop. Wait for explicit user instruction.

The author's personal git workflow preferences (commit signing, attribution style, identity selection, etc.) live in local agent memory, not in this public file. External contributors should follow their own conventions; this repo does not enforce signing or attribution policies.

## How to Consume This Repo (for Agents)

If you are starting a new session and need context:

1. Read this file (`AGENTS.md`)
2. Read the public `README.md` for the topic overview
3. Read the topic's `README.md` (e.g., `pi-agent-core/README.md`)
4. If deeper context is needed, look for `related_docs` pointers in any session-interchange files the user provides

Do not read every file in the repo unprompted. Use the topic README as the index.

## How to Extend This Repo

When starting research on a new AI agent topic:

1. Create `<topic-name>/` directory at the repo root
2. Add `README.md` as topic index (see `pi-agent-core/README.md` for structure)
3. Update root `README.md` topic index
4. Begin research notes as individual `.md` files inside the topic directory
5. Cross-link to other topics when relevant

## File Editing Rules

- Prefer editing existing files over creating new ones
- Markdown only — no proprietary formats
- No emojis unless explicitly requested
- Keep lines under 120 chars where possible
- Use code blocks with language tags for any code

## Validation Before Committing

- Run `git diff --cached` and review the staged content
- Verify no credentials, no PII, no sensitive paths
- Verify commit message follows conventional commits
- Ask user before pushing

## Contact

For questions about this repo, the author's public identity is **athallarizky** on GitHub. No other contact info is published.
