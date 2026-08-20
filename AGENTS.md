# AGENTS.md

Single source of truth for any AI agent working in this repository.

If you are an LLM-based agent (Claude Code, Cursor, Continue, Aider, Codex, custom agent, etc.) reading this for the first time: **read this file completely before doing anything else.**

## Repository Identity

**`research-ai-agents`** — Personal research notes on AI agents: architectures, frameworks, tooling, and experiments.

- **Author:** athallarizky (public identity)
- **Visibility:** Public open-source
- **License:** MIT
- **Sister repo (private):** `research-ai-agents-sessions` — raw session archives. Not in this repo.

## Scope

This repository is for **research and discussion only**.

- Do not implement code or technical solutions for the topics researched here
- Do not suggest implementation as a next step — follow-up work is more
  research, discussion, or documentation
- The only executable code in this repo is `session-interchange-format/tools/`,
  which serves the spec itself

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
| [`ai-terminology-map/`](./ai-terminology-map) | Taxonomy of AI terms (concept/technique/pattern/methodology/architecture/protocol/artifact) + "X engineering" stack |
| [`huawei-wearable-agents/`](./huawei-wearable-agents) | AI agents on Huawei wearables (Watch Fit 4 Pro) — Lite Wearable platform, DevEco/Wear Engine toolchain, thin-client agent architecture, two-lane bridge design (Lane A MVP: remote Claude Code from Termux) |
| [`vps-agent-patterns/`](./vps-agent-patterns) | Running agents on your own server for repo automation — agent loop concept, framework landscape (LangChain vs Agent SDK vs headless CLI vs raw loop), trigger wiring (webhook receiver / self-hosted runner / daemon+cron), guardrails, ideas catalog |

### Topic Conventions

- One directory per topic, `kebab-case` name
- Each topic has a `README.md` as the entry point
- Supporting notes, diagrams, code live alongside
- Cross-link between topics with relative paths
- No numeric prefixes on filenames

### Recommended Topic Structure

Topics vary in nature — some are framework deep-dives, others are evaluation-heavy, methodology-focused, or comparison-driven. The patterns below are **not mandatory**; use what fits each topic. Skip what doesn't.

Patterns proven useful in [`pi-agent-core/`](./pi-agent-core) (the reference implementation):

**Structural (organize knowledge):**

- **Overview** — what it is, why it matters
- **Comparison tables** — vs alternatives, side-by-side
- **Pros/cons** — for decision-making contexts
- **Rule of thumb** — quick reference for common decisions

**Conceptual aids (build mental model):**

- **Analogies** — relate to concepts the audience already knows (frameworks, patterns, everyday objects). Examples from `pi-agent-core`: "Pi is Express.js for AI agents", "Agent = useState on the server", "LangChain:Spring Boot :: Pi:Express :: LangGraph:Temporal". Caveat: analogies are imperfect — pick ones the target audience will recognize, and don't force them where they don't fit.
- **Glossary** — define terms specific to the topic

**Concrete artifacts (grounding):**

- **Code examples** — minimal, runnable snippets
- **ASCII diagrams** — when visual structure helps (architecture, flow, decision trees)

See [`pi-agent-core/`](./pi-agent-core) for a complete worked example (14 files covering all patterns above). Pick the subset that fits the topic's nature; don't force all patterns into every topic.

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
