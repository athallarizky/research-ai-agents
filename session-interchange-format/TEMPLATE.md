# Session Interchange Format — Template

Copy this file as the starting point for a new session file. Replace placeholders in `<...>` with real content. Delete optional sections you don't use. Keep all required sections even if empty (write `_None._` if empty).

---

```markdown
---
session_id: <topic-slug>-YYYY-MM-DD
title: <Human-readable title>
date: YYYY-MM-DD
status: in-progress
agent: <Claude Code (Sonnet 4.5) | Cursor (GPT-5) | Custom Pi Agent v0.3 | ...>
tools_used: [<Tool1>, <Tool2>, ...]
topics: [<topic1>, <topic2>, ...]
duration_minutes: <integer>
source_sessions:
  - <local://path-or-uri>
related_docs:
  - <relative/path/to/public/doc.md>
version: 0.1.0
---

# <Title>

## Context

<1-3 paragraphs explaining why this session happened. What triggered it? What did the participant(s) want to achieve? Keep factual, no PII.>

## Key Findings

- <Finding 1 — concise, factual, 1-2 sentences>
- <Finding 2>
- <Finding 3>

## Notable Decisions

- <Decision 1 — what was decided, brief rationale if non-obvious>
- <Decision 2>

## Open Threads

- [ ] <Open question or future work item>
- [ ] <Open question>

## References

- [External link 1](https://example.com/...)
- [External link 2](https://example.com/...)
```

---

## Optional Sections (insert in this order if used)

### Notable Exchanges
Place between `## Key Findings` and `## Notable Decisions`.

```markdown
## Notable Exchanges

> **Q:** <redacted question that illustrates the key reasoning turn>
>
> **A:** <summary of the answer, redacted>

> **Q:** <another key exchange>
>
> **A:** <summary>
```

### Code Snippets
Place after `## Notable Decisions`.

```markdown
## Code Snippets

\`\`\`typescript
// <What this code does, in one line>
<code>
\`\`\`
```

### Glossary
Place after `## Open Threads` (before References).

```markdown
## Glossary

- **Term 1**: <definition>
- **Term 2**: <definition>
```

---

## Minimal Example

A completed file with only required sections:

```markdown
---
session_id: pi-agent-core-2026-08-08
title: Pi Agent Core — Initial Research
date: 2026-08-08
status: in-progress
agent: Claude Code (Sonnet 4.5)
tools_used: [WebFetch, Bash, Read, Write]
topics: [pi-agent-core, langchain, mcp, rag]
duration_minutes: 90
related_docs:
  - /pi-agent-core/README.md
version: 0.1.0
---

# Pi Agent Core — Initial Research

## Context

Investigated Pi (earendil-works/pi) as a candidate runtime layer for custom AI agents. Goal: determine positioning vs LangChain/LangGraph, understand architecture, identify use cases for FDE-style deployments.

## Key Findings

- Pi is an agent runtime (turn-based ReAct loop), not an orchestration framework like LangChain
- ~85k stars, 1 year old, TypeScript, MIT licensed
- 10 packages: agent, ai, server, client, protocol, tui, telemetry, evals, session-backends, coding-agent
- No built-in RAG primitives — orthogonal to LangChain's main pitch

## Notable Decisions

- Use Pi as outer agent runtime for custom products (not as LangChain replacement)
- Combine with RAG for knowledge base access (agentic RAG pattern)

## Open Threads

- [ ] Compare pi-agent-core vs Vercel AI SDK in detail
- [ ] Implement minimal MCP server using Pi
- [ ] Sketch Indomaret automation architecture using pi-agent-core

## References

- [earendil-works/pi](https://github.com/earendil-works/pi)
```
