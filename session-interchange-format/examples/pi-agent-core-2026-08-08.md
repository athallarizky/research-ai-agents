---
session_id: pi-agent-core-2026-08-08
title: Pi Agent Core — Initial Research
date: 2026-08-08
status: in-progress
agent: Claude Code (Sonnet 4.5)
tools_used: [WebFetch, Bash, Read, Write]
topics: [pi-agent-core, langchain, langgraph, mcp, rag]
duration_minutes: 90
related_docs:
  - /pi-agent-core/README.md
version: 0.1.0
---

# Pi Agent Core — Initial Research

## Context

Investigated **Pi** (`earendil-works/pi`) as a candidate agent runtime. Goal: determine positioning vs LangChain / LangGraph, understand architecture, identify realistic use cases for Forward Deployed Engineer (FDE) deployments and personal projects. Source material was the GitHub repository itself, fetched via WebFetch and the GitHub API.

## Key Findings

- Pi is an **agent runtime** (turn-based ReAct loop), not an orchestration framework like LangChain
- ~85k stars, 1 year old, TypeScript monorepo, MIT licensed
- **10 packages**: `agent`, `ai`, `coding-agent`, `tui`, `telemetry`, `server`, `client`, `protocol`, `session-backends`, `evals`
- Core abstraction: `Agent` class with `AgentState` (systemPrompt + model + tools + messages), TypeBox-typed tools, `beforeToolCall` / `afterToolCall` hooks
- Loop is implicit (LLM is the orchestrator), not an explicit graph like LangGraph
- No built-in RAG primitives — intentionally orthogonal to LangChain's main pitch
- Closest competitors are Vercel AI SDK, Mastra, LlamaIndex Agents — not LangChain

## Notable Decisions

- Use Pi as outer agent runtime for custom products (not as LangChain replacement)
- Combine with RAG for knowledge base access (agentic RAG pattern — RAG as a tool the agent calls when needed)
- Reserve LangGraph for workflows that need explicit state machines, checkpointing, or multi-day approval flows
- Adopt single `AGENTS.md` convention (not per-tool files like `CLAUDE.md` / `.cursorrules`) — point to it from `README.md`

## Open Threads

- [ ] Compare pi-agent-core vs Vercel AI SDK in detail (DX, hooks, type safety, streaming)
- [ ] Implement minimal MCP server using pi-agent-core
- [ ] Sketch Indomaret automation architecture using pi-agent-core as the "brain"
- [ ] Evaluate pi-evals for testing agent behavior in a real project
- [ ] Investigate pi-session-backends for multi-device session continuity

## References

- [earendil-works/pi](https://github.com/earendil-works/pi)
- [Pi agent-core README](https://github.com/earendil-works/pi/blob/main/packages/agent/README.md)
- [Model Context Protocol spec](https://modelcontextprotocol.io/)
