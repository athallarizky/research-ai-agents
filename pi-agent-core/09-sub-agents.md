# 09 — Sub-Agents dan Multi-Agent di Pi

## Miskonsepsi umum

> "Pi-core tidak bisa implement sub-agent, jadi harus kombinasikan LangGraph?"

**Salah.** Pi-core bisa sub-agent melalui beberapa pola.

## Pola 1: Sub-agent sebagai tool (tanpa LangGraph)

Sebuah tool Pi bisa **spawn Agent lain** di dalam `execute`:

```typescript
import { Agent, type AgentTool } from "@earendil-works/pi-agent-core";
import { Type } from "typebox";

// Sub-agent yang specialize di riset
const researchTool: AgentTool = {
  name: "delegate_research",
  description: "Delegate research task to specialist agent",
  parameters: Type.Object({ topic: Type.String() }),
  execute: async (_id, params, signal) => {
    // Spawn sub-agent
    const researcher = new Agent({
      initialState: {
        systemPrompt: "Kamu research specialist. Pakai tools untuk cari info.",
        model,
        tools: [searchWeb, scrapePage, citeSources],
      },
      streamFn: models.streamSimple.bind(models),
    });

    const result = await researcher.prompt(params.topic, { signal });
    return {
      content: [{ type: "text", text: result.finalText }],
      details: { sources_count: result.sources.length },
    };
  },
};

// Main agent
const mainAgent = new Agent({
  initialState: {
    systemPrompt: "Kamu orchestrator. Delegasikan ke specialist bila perlu.",
    model,
    tools: [researchTool, financeTool, marketTool],  // 3 sub-agent
  },
  streamFn: models.streamSimple.bind(models),
});
```

## Pola 2: Parallel tool execution (built-in Pi)

Pi sudah punya `toolExecution: "parallel"`:

```typescript
const agent = new Agent({
  // ...
  toolExecution: "parallel",  // LLM request 3 tools → jalan barengan
});
```

Saat LLM minta `researchTool + financeTool + marketTool` sekaligus, Pi jalanin ketiganya paralel tanpa LangGraph.

## Pola 3: Multiple Agent instances di aplikasi

```typescript
// 3 independent agents running concurrently
const [research, finance, market] = await Promise.all([
  researchAgent.prompt(topic),
  financeAgent.prompt(topic),
  marketAgent.prompt(topic),
]);

// Synthesize dengan agent ke-4
const synthesizer = new Agent({...});
const final = await synthesizer.prompt(
  `Combine these analyses:\n${research}\n${finance}\n${market}`
);
```

## Kapan tetap butuh LangGraph?

Pi bisa sub-agent, tapi LangGraph punya kekuatan yang Pi tidak punya:

| Fitur | Pi-core | LangGraph |
|---|---|---|
| Single agent loop | Excellent | Bisa tapi canggung |
| Sub-agent via tool | Bisa | Bisa |
| Parallel tool exec | Built-in (`parallel` mode) | Fan-out/fan-in edges |
| **Explicit state machine** | Tidak (state implicit) | Ya, typed state, edges, conditional routing |
| **Checkpointing (resume mid-workflow)** | Tidak native | Ya, Postgres/Redis checkpointers |
| **Visual graph debugging** | Tidak | Ya, LangSmith graph view |
| **Time travel (rewind state)** | Tidak | Ya, built-in |
| **Long-running workflow (jam/hari)** | Kurang cocok | Cocok |
| **Heterogeneous nodes (LLM + function + human)** | Manual | Native |

## Diagram Pi + LangGraph (kombinasi)

```
                       ┌──────────────────────┐
                       │   USER REQUEST       │
                       └──────────┬───────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────────┐
                  │   LANGGRAPH (orchestrator)        │
                  │   Explicit state machine          │
                  │                                   │
                  │   • Typed state                   │
                  │   • Checkpoints                   │
                  │   • Conditional edges             │
                  │   • Resume after human approval   │
                  └────────────┬──────────────────────┘
                               │
                               │ fan-out parallel
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
       │ NODE A      │  │ NODE B      │  │ NODE C      │
       │             │  │             │  │             │
       │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │
       │ │Pi Agent │ │  │ │Pi Agent │ │  │ │Pi Agent │ │
       │ │research │ │  │ │finance  │ │  │ │market   │ │
       │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │
       │             │  │             │  │             │
       │ LLM: Claude │  │ LLM: GPT-4  │  │ LLM: Gemini │
       │ Tools:      │  │ Tools:      │  │ Tools:      │
       │  search_web │  │  query_sec  │  │  nielsen    │
       │  scrape     │  │  calc_dcf   │  │  social     │
       └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
              │                │                │
              └────────────────┼────────────────┘
                               │
                               │ fan-in
                               ▼
                  ┌───────────────────────────────────┐
                  │   NODE: Synthesize (LangGraph)    │
                  │                                   │
                  │   ┌─────────────────────────┐     │
                  │   │ Pi Agent Synthesizer    │     │
                  │   │ LLM: Claude Opus        │     │
                  │   └─────────────────────────┘     │
                  └────────────┬──────────────────────┘
                               │
                               │ human-in-loop checkpoint
                               ▼
                  ┌───────────────────────────────────┐
                  │   WAIT FOR HUMAN APPROVAL         │
                  │   (resume dari checkpoint)        │
                  └────────────┬──────────────────────┘
                               │
                               ▼
                       ┌──────────────┐
                       │ FINAL OUTPUT │
                       └──────────────┘
```

## Kapan pakai Pi-only vs Pi+LangGraph?

```
                    ┌──────────────────────────────┐
                    │  Pertanyaan: butuh sub-agent?│
                    └──────────────┬───────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │ Workflow punya state yang    │
                    │ eksplisit + butuh resume     │
                    │ mid-way (jam/hari/minggu)?   │
                    └──────────────┬───────────────┘
                                   │
                  ┌────────────────┴────────────────┐
                  │                                 │
                  ▼ NO                              ▼ YES
        ┌──────────────────┐              ┌──────────────────┐
        │ PI-ONLY          │              │ LANGGRAPH + PI   │
        │                  │              │                  │
        │ Pola:            │              │ Pola:            │
        │ - Sub-agent via  │              │ - LangGraph =    │
        │   tool           │              │   state machine  │
        │ - Parallel tools │              │ - Each node      │
        │ - Main agent     │              │   wraps Pi agent │
        │   orchestrate    │              │ - Checkpoint     │
        │                  │              │   untuk resume   │
        │ Contoh:          │              │                  │
        │ - CS assistant   │              │ Contoh:          │
        │ - Coding agent   │              │ - Legal contract │
        │ - Internal ops   │              │   review (jam)   │
        │ - Q&A dengan DB  │              │ - Multi-team     │
        │                  │              │   approval flow  │
        │                  │              │ - Compliance     │
        │                  │              │   audit trail    │
        │                  │              │ - Research       │
        │                  │              │   pipeline       │
        │                  │              │                  │
        │ Time: detik-menit│              │ Time: jam-hari   │
        └──────────────────┘              └──────────────────┘
```

## Contoh konkret kapan masing-masing menang

### Pi-only menang

**Skenario:** CS Indomaret chat — "Apa stok beras cukup? Mau beli 30."

```
Main Agent
  ├─ call tool check_stock (parallel)
  ├─ call tool check_promo (parallel)
  ├─ reasoning: stok cukup, ada promo
  └─ respond user
```

Sub-agent nggak perlu. Satu Pi agent cukup. **Tidak perlu LangGraph.**

### Pi + LangGraph menang

**Skenario:** Proses approval kontrak vendor baru

```
LangGraph workflow (state: contract_id, stage, approvers[]):

  [ingest_contract]
       │
       ▼
  [extract_terms] ─── Pi agent: parse PDF, extract clauses
       │
       ▼
  [legal_review] ──── Pi agent: identify risky clauses
       │
       ├────────── parallel fan-out ──────────┐
       │                                      │
       ▼                                      ▼
  [finance_review] ──── Pi agent:     [compliance_review] ── Pi agent:
       analyze pricing, payment         check BPJS, SIUP, etc.
       terms, currency risk
       │                                      │
       └────────────── fan-in ────────────────┘
                        │
                        ▼
              [synthesize_report] ── Pi agent: combine all reviews
                        │
                        ▼
              [CHECKPOINT] ── wait for human approval
                        │
                        ▼
              [execute_signature]
                        │
                        ▼
              [notify_vendor]

  State disimpan di Postgres. Kalau crash di tengah, bisa resume.
  Approval bisa sehari-seminggu. Checkpoint menjaga state.
```

**LangGraph menjaga:** state, resume, branching, audit.
**Pi menjaga:** reasoning di tiap node, tool use, multi-provider LLM.

## Verdict pemahaman

| Pernyataan | Verdict |
|---|---|
| "Pi-core tidak bisa implement sub-agent" | **Salah.** Pi bisa sub-agent via tool atau multi-instance |
| "Kombinasi LangGraph + Pi valid" | **Benar.** Pattern yang strong untuk workflow kompleks |
| "LangGraph spawn tools yang di-wrap Pi paralel" | **Sebagian benar.** Tepatnya: LangGraph jadi orchestrator/state machine, Pi jadi isi tiap node |
| "Parallel execution butuh LangGraph" | **Salah.** Pi sudah punya parallel tool execution built-in |
