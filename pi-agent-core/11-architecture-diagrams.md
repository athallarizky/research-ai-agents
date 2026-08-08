# 11 — Diagram Arsitektur (ASCII)

Kumpulan diagram dari diskusi untuk referensi visual.

---

## Diagram 1: Case (a) — Pi + LangGraph sebagai sub-workflow

**Skenario:** User minta analisis kompleks → agent Pi jadi outer loop, tool-nya memanggil LangGraph untuk sub-task yang butuh banyak step + branching.

```
                        ┌──────────────────┐
                        │   USER (chat)    │
                        └────────┬─────────┘
                                 │
                                 ▼
        ┌────────────────────────────────────────────────┐
        │  PI AGENT-CORE (outer loop)                    │
        │                                                │
        │  State: systemPrompt + tools + messages        │
        │  LLM: Claude Sonnet 4.6                        │
        │                                                │
        │  Tools: [check_stock] [run_analysis] [notify]  │
        └──────┬─────────────────┬───────────────────────┘
               │                 │
               │ simple          │ complex multi-step
               │ query           │
               ▼                 ▼
        ┌──────────────┐  ┌──────────────────────────────┐
        │  Postgres    │  │  TOOL: run_analysis(topic)   │
        │  direct      │  │                              │
        │  query       │  │  Internally invokes:         │
        └──────────────┘  │                              │
                          │  ┌────────────────────────┐  │
                          │  │ LANGGRAPH WORKFLOW     │  │
                          │  │                        │  │
                          │  │  [fetch_sales]  ──┐    │  │
                          │  │  [fetch_stock]  ──┤    │  │
                          │  │  [fetch_promo]  ──┤    │  │
                          │  │                   ▼    │  │
                          │  │            [correlate] │  │
                          │  │                   │    │  │
                          │  │            ┌──────┴──┐ │  │
                          │  │            ▼         ▼ │  │
                          │  │       [anomaly?]  [ok] │  │
                          │  │            │         │ │  │
                          │  │            ▼         ▼ │  │
                          │  │       [investigate] [skip]│
                          │  │            │            │  │
                          │  │            └─────┬──────┘  │
                          │  │                  ▼         │
                          │  │             [summarize]    │  │
                          │  │                  │         │  │
                          │  │                  ▼         │  │
                          │  │              [output]      │  │
                          │  └────────────────────────────┘  │
                          │                                  │
                          │  Returns: "Ditemukan anomaly:   │
                          │  stok turun 40% tapi sales       │
                          │  naik 10% — indikasi shrinkage"  │
                          │                                  │
                          │  → diserap Pi agent sebagai      │
                          │    "content" untuk reasoning     │
                          └──────────────────────────────────┘
                                          │
                                          ▼
                        ┌──────────────────────────────────┐
                        │ PI agent lanjut reasoning:       │
                        │ "Mau saya buat tiket investigasi │
                        │  dan notifikasi supervisor?"     │
                        └──────────────────────────────────┘
```

**Pemisahan tugas:**
- **Pi:** conversation, decision, kapan panggil sub-workflow, format response
- **LangGraph:** sub-task yang punya flow deterministik + branching + checkpoint

---

## Diagram 2: Case (b) — MCP server + Pi konsumsi

**Skenario:** Perusahaan punya katalog tool terpusat (Slack, Jira, ERP) yang dipakai banyak agent (Pi sendiri + Claude Code + Cursor + agent lain).

```
    ┌─────────────────────────────────────────────────────────┐
    │              KATALOG MCP SERVERS                        │
    │                                                         │
    │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
    │   │ slack-mcp    │  │ jira-mcp     │  │ erp-mcp      │  │
    │   │              │  │              │  │              │  │
    │   │ tools:       │  │ tools:       │  │ tools:       │  │
    │   │ • send_msg   │  │ • create_tix │  │ • query_stock│  │
    │   │ • read_chan  │  │ • update_tix │  │ • get_orders │  │
    │   │ • search_msg │  │ • list_mine  │  │ • get_promo  │  │
    │   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
    └──────────┼─────────────────┼─────────────────┼──────────┘
               │                 │                 │
               │   MCP protocol (JSON-RPC)         │
               │   over stdio / SSE / HTTP         │
               │                 │                 │
    ╔══════════╪═════════════════╪═════════════════╪══════╗
    ║   ┌──────▼─────────────────▼─────────────────▼──┐   ║
    ║   │        MCP CLIENT LAYER (di masing-masing   │   ║
    ║   │        agent platform)                      │   ║
    ║   └──────┬─────────────────┬─────────────────┬──┘   ║
    ║          │                 │                 │       ║
    ║   ┌──────▼─────┐    ┌──────▼─────┐    ┌──────▼───┐  ║
    ║   │ PI AGENT   │    │ CLAUDE CODE│    │ CURSOR   │  ║
    ║   │ (app kamu) │    │ (CLI)      │    │ (IDE)    │  ║
    ║   │            │    │            │    │          │  ║
    ║   │ LLM:       │    │ LLM:       │    │ LLM:     │  ║
    ║   │ Claude     │    │ Claude     │    │ Claude/  │  ║
    ║   │            │    │            │    │ GPT      │  ║
    ║   └─────┬──────┘    └────────────┘    └──────────┘  ║
    ║         │                                            ║
    ╚═════════╪════════════════════════════════════════════╝
              │
              ▼
       ┌──────────────┐
       │  Anthropic   │
       │  API         │
       └──────────────┘
```

---

## Diagram 3: Case (c) — Hybrid REST + Agent

**Skenario:** Dashboard admin Indomaret. Sebagian fitur butuh data display cepat (REST), sebagian butuh reasoning (agent).

```
┌─────────────────────────────────────────────────────────────────┐
│                    REACT ADMIN DASHBOARD                        │
│                                                                 │
│   ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│   │ Products     │  │ Inventory    │  │ Smart Assistant    │    │
│   │ Table        │  │ Real-time    │  │ Chat               │    │
│   │              │  │ Chart        │  │                    │    │
│   │GET /products │  │WS /inventory │  │POST /chat (SSE)    │    │
│   └──────┬───────┘  └──────┬───────┘  └─────────┬──────────┘    │
└──────────┼─────────────────┼─────────────────────┼──────────────┘
           │                 │                     │
           │ REST            │ WebSocket           │ SSE stream
           ▼                 ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXPRESS BACKEND                              │
│                                                                 │
│  ┌─────────────────────────┐        ┌─────────────────────────┐ │
│  │ TRADITIONAL REST        │        │ AGENT ROUTES            │ │
│  │                         │        │                         │ │
│  │ GET  /products          │        │ POST /chat              │ │
│  │   → db.query()          │        │   → new Agent({...})    │ │
│  │   → res.json(rows)      │        │   → agent.prompt(msg)   │ │
│  │                         │        │   → stream events       │ │
│  │ POST /orders            │        │                         │ │
│  │   → db.insert()         │        │ POST /research          │ │
│  │   → res.json({ok})      │        │   → long-running agent  │ │
│  │                         │        │                         │ │
│  │ GET  /reports/sales     │        │ POST /escalate          │ │
│  │   → db.query()          │        │   → agent + human loop  │ │
│  │   → res.json(stats)     │        │                         │ │
│  │                         │        │ Tools (dipakai agent):  │ │
│  │ (fast, structured,      │        │  [query_sales]          │ │
│  │  no LLM, low cost)      │        │  [query_stock]          │ │
│  │                         │        │  [check_promo]          │ │
│  │                         │        │  [create_order]         │ │
│  │                         │        │  [escalate_human]       │ │
│  │                         │        │                         │ │
│  │                         │        │ (reasoning, multi-step, │ │
│  │                         │        │  adaptive, higher cost) │ │
│  └────────────┬────────────┘        └────────────┬────────────┘ │
│               │                                  │              │
│               └────────────┬─────────────────────┘              │
│                            │                                    │
│                            ▼                                    │
│               ┌─────────────────────────┐                       │
│               │  Shared services:       │                       │
│               │  • Postgres             │                       │
│               │  • Auth middleware      │                       │
│               │  • Logger / Sentry      │                       │
│               │  • Redis cache          │                       │
│               └─────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

### Decision tree: frontend milih endpoint mana?

```
                    ┌──────────────────────────────┐
                    │  User butuh informasi apa?   │
                    └──────────────┬───────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │  User butuh                  │
                    │  reasoning / saran /         │
                    │  decision / explanation?     │
                    └──────────────┬───────────────┘
                                   │
                  ┌────────────────┴───────────────┐
                  │                                │
                  ▼ NO                             ▼ YES
        ┌──────────────────┐              ┌──────────────────┐
        │ REST endpoint    │              │ Agent endpoint   │
        │                  │              │                  │
        │ Contoh:          │              │ Contoh:          │
        │ • List produk    │              │ "Kenapa stok X   │
        │ • Filter         │              │  turun?"         │
        │ • Sort           │              │                  │
        │ • Bulk edit      │              │ "Rekomendasi     │
        │ • Real-time      │              │  restock apa?"   │
        │   stock          │              │                  │
        │ • Upload CSV     │              │ "Bantu compose   │
        │ • Display chart  │              │  email ke        │
        │                  │              │  supplier"       │
        │ Cost: ~$0        │              │                  │
        │ Latency: ~50ms   │              │ Cost: $0.01-0.10 │
        │                  │              │ Latency: 1-10s   │
        └──────────────────┘              └──────────────────┘
```

---

## Diagram 4: Pi untuk Indomaret Automation

**Skenario:** Pakai Pi sebagai otak agent AutoJs6 di Android.

```
┌─────────────────────────────────┐
│  Web Admin Panel (React)        │
│  • Submit task ke agent         │
│  • Monitor eksekusi             │
│  • View logs                    │
└────────────┬────────────────────┘
             │
             │ HTTP/WebSocket
             │
             ▼
┌─────────────────────────────────┐
│  Pi Server (Node.js)            │
│  ┌───────────────────────────┐  │
│  │ Agent instance            │  │
│  │ • System prompt           │  │
│  │ • Tools:                  │  │
│  │   - click_via_autojs      │  │
│  │   - read_screen           │  │
│  │   - fill_form             │  │
│  │   - wait_for_state        │  │
│  │   - take_screenshot       │  │
│  │ • LLM: Claude Sonnet 4.6  │  │
│  └───────────────────────────┘  │
│  • Session persistence          │
│  • Audit log (semua aksi)       │
└────────────┬────────────────────┘
             │
             │ HTTP command
             │
             ▼
┌─────────────────────────────────┐
│  HP Android (Termux + AutoJs6)  │
│  • HTTP server (port 8080)      │
│  • AutoJs6 script runner        │
│  • Accessibility Service        │
│  • Capture UI tree              │
│  • Execute clicks/inputs        │
└────────────┬────────────────────┘
             │
             │ Accessibility API
             │
             ▼
┌─────────────────────────────────┐
│  Klik Indomaret App             │
└─────────────────────────────────┘
```

---

## Diagram 5: Decision Matrix Akhir

```
                    ┌──────────────────────────────────────┐
                    │   Pertanyaan: backend architecture?  │
                    └──────────────────┬───────────────────┘
                                       │
                                       ▼
                    ┌──────────────────────────────────────┐
                    │   Apakah butuh LLM reasoning?        │
                    └──────────────────┬───────────────────┘
                                       │
                  ┌────────────────────┴────────────────────┐
                  │                                         │
                  ▼ NO                                      ▼ YES
            ┌─────────┐                          ┌──────────────────┐
            │ REST    │                          │ Butuh multi-step │
            │ only    │                          │ branching        │
            │         │                          │ workflow?        │
            └─────────┘                          └────────┬─────────┘
                                                          │
                                              ┌───────────┴───────────┐
                                              │                       │
                                              ▼ YES                   ▼ NO
                                       ┌──────────┐            ┌──────────────┐
                                       │LangGraph │            │ Pi agent     │
                                       │ workflow │            │ + RAG tools  │
                                       │(complex) │            │(single loop) │
                                       └──────────┘            └──────────────┘
                                              │                       │
                                              └───────┬───────────────┘
                                                      │
                                                      ▼
                                       ┌──────────────────────────┐
                                       │  Perlu share tools ke    │
                                       │  agent lain (Claude Code,│
                                       │  Cursor, partner)?       │
                                       └────────────┬─────────────┘
                                                    │
                                          ┌─────────┴──────────┐
                                          │                    │
                                          ▼ YES                ▼ NO
                                    ┌──────────┐         ┌──────────────┐
                                    │Expose via│         │Direct Pi     │
                                    │MCP server│         │tool          │
                                    └──────────┘         └──────────────┘
```
