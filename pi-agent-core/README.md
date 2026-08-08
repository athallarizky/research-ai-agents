# Pi Agent Core — Research & Notes

Hasil riset dan diskusi tentang **Pi** (https://github.com/earendil-works/pi) — AI agent toolkit oleh earendil-works.

## Cara baca

**Mulai dari sini kalau baru baca:**
1. `01-what-is-pi.md` — gambaran umum, fakta repo, paket yang ada
2. `02-comparisons.md` — Pi vs LangChain vs LangGraph (decision table)
3. `12-rule-of-thumb.md` — kapan pakai apa (quick reference)

**Topik spesifik (baca sesuai kebutuhan):**
- `03-pi-architecture.md` — API surface, Agent class, tools, hooks
- `04-customization-layers.md` — 3 level kustomisasi + analogi Express/React
- `05-use-cases-fde-enterprise.md` — validitas untuk Forward Deployed Engineer & enterprise
- `06-pi-and-rag.md` — apakah Pi ganti RAG? (no — agentic RAG pattern)
- `07-pi-and-mcp.md` — bedanya MCP server vs Pi
- `08-why-db-in-tool.md` — kenapa query DB di dalam tool, bukan di API handler
- `09-sub-agents.md` — pola sub-agent dan multi-agent di Pi
- `10-code-examples.md` — kode konkret Express + Pi + React
- `11-architecture-diagrams.md` — semua diagram ASCII dari diskusi
- `14-loop-mechanics-and-positioning.md` — bagaimana agent loop bekerja, Pi vs LangGraph orchestrator, positioning vs LangChain
- `13-glossary.md` — istilah-istilah kunci

## Fakta repo (per 2026-08-07)

- **URL:** https://github.com/earendil-works/pi
- **Stars:** 84,794
- **Forks:** 10,502
- **Created:** 2025-08-09 (~1 tahun)
- **License:** MIT
- **Language:** TypeScript (monorepo)
- **Org:** earendil-works

## TL;DR

Pi **bukan** pengganti LangChain. Pi adalah **agent runtime/harness** — paling dekat dengan "open-source Claude Code harness". Layer-nya:

- `pi-ai` → LLM abstraction multi-provider
- `pi-agent-core` → agent loop + tools + hooks (intinya)
- `pi-coding-agent` → CLI siap pakai (produk)
- `pi-server` + `pi-client` + `pi-protocol` → deployment client/server
- `pi-tui` → komponen terminal UI
- `pi-telemetry` → observability
- `pi-evals` → testing agent behavior
- `pi-session-backends` → persistence
