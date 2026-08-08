# 12 — Rule of Thumb (Quick Reference)

Cheat sheet cepat untuk decision making. Baca ini kalau lupa.

## Aturan 1: Pilih level stack yang tepat

```
 kompleksitas workflow
        ▲
        │
   high │            ┌──────────────────┐
        │            │ LangGraph + Pi   │  ← state machine, checkpoint, multi-day
        │            └──────────────────┘
        │
        │       ┌──────────────────────┐
        │       │ Pi multi-agent      │  ← beberapa agent, paralel, hooks
        │       │ (tool-based)        │
        │       └──────────────────────┘
        │
        │  ┌────────────────────────────┐
        │  │ Pi single agent            │  ← loop + tools, simple
        │  └────────────────────────────┘
        │
   low  │  ┌────────────────────────────┐
        │  │ Direct LLM SDK call        │  ← sekali call, no tool
        │  └────────────────────────────┘
        └──────────────────────────────────────►
                        capability / cost
```

**Aturan:** pilih level paling rendah yang masih cukup untuk kebutuhanmu.

## Aturan 2: Kapan pakai apa (quick decision)

| Situasi | Pakai |
|---|---|
| Cuma butuh LLM call sekali, no tool | Anthropic/OpenAI SDK langsung |
| Agent yang panggil tool, simple loop | Pi-core |
| Multi-agent paralel + hooks | Pi-core (multi-instance) |
| Workflow kompleks dengan state + resume | LangGraph + Pi di dalam node |
| RAG klasik (load → chunk → embed → retrieve) | LangChain |
| Coding agent CLI | Pi-coding-agent |
| Customer service chat | Pi-core + tools |
| Multi-day approval workflow | LangGraph |

## Aturan 3: REST vs Agent endpoint

**REST kalau:**
- Display data di UI (table, chart)
- Bulk CRUD operations
- Real-time push
- User tidak butuh interpretasi
- Latency harus < 200ms

**Agent kalau:**
- User butuh reasoning/explanation
- Multi-step decision
- Format response adaptif
- Intent ambigu perlu clarify
- Compose pesan/email

**Hybrid:** pakai dua-duanya di repo yang sama.

## Aturan 4: Kapan DB di dalam tool vs di API handler

```
DB di dalam Tool (agent)    → user butuh reasoning/saran/decision
DB di API handler (REST)    → user butuh data display mentah
```

## Aturan 5: Kapan butuh RAG

- Corpus > 50 dokumen → RAG
- User tidak tahu dokumen mana relevan → RAG
- Compliance wajib cite sumber → RAG
- Path/ID dokumen sudah diketahui → tidak perlu RAG
- Live data dari DB → tidak perlu RAG (query langsung)

**Pola terbaik:** RAG sebagai tool yang dipanggil Pi agent (Agentic RAG).

## Aturan 6: MCP server vs Pi tool lokal

**MCP server kalau:**
- 3+ agent platform butuh tool yang sama
- Tool di-maintain tim berbeda
- Mau ekspos tool ke eksternal

**Pi tool lokal kalau:**
- Cuma 1 agent
- Tool cuma dipakai 1 aplikasi
- Memprioritaskan latency (no network hop)

## Aturan 7: Pi customization level

| Level | Pakai kalau |
|---|---|
| Level 1: `pi-coding-agent` (CLI) | Mau coding agent siap pakai dengan config |
| Level 2: `pi-agent-core` (library) | Mau bikin produk custom (API, server, app) |
| Level 3: `pi-ai` saja | Cuma butuh LLM abstraction, agent loop sendiri |

## Aturan 8: Enterprise readiness checklist

**Yang sudah ada di Pi:**
- Telemetry hooks
- Session backends
- Server/client/protocol split
- Evals
- Pinned deps
- MIT license

**Yang harus di-build di atas:**
- Permission system
- RBAC / SSO
- Rate limiting + cost tracking
- Audit log
- Admin dashboard
- Compliance certifications

## Aturan 9: FDE decision cepat

**Pakai Pi kalau:**
- Customer butuh agent custom dalam minggu
- Customer dictate LLM vendor
- Kamu kontrol deployment (VPC/on-prem)
- Identity system ikut customer

**Jangan pakai Pi kalau:**
- Customer butuh SLA komersial dari vendor
- Regulated industry demanding vendor compliance cert
- Multi-tenant SaaS shared instance
- Butuh RAG/orchestration kompleks

## Aturan 10: Pemetaan konsep JS/TS

| Yang kamu kenal | Setara di Pi |
|---|---|
| `express()` instance | `new Agent(...)` |
| `app.use(middleware)` | `beforeToolCall` / `afterToolCall` |
| `app.get(path, handler)` | Define `AgentTool` dengan `execute` |
| `req` / `res` | `agent.subscribe(event)` stream |
| React `useState` + `useEffect` | `AgentState` + `agent.subscribe` |
| Next.js API route | Tool definition |
| React Server Component | Agent running di backend |
| Client Component | React app calling agent API |
| tRPC procedure | Tool Pi dengan TypeBox schema |
| Sentry/logging middleware | `pi-telemetry` |

## Aturan 11: Tool return — content vs details

```typescript
return {
  content: [{ type: "text", text: "Stok: 12 unit" }],  // LLM baca ini
  details: { sku: "BERAS-5KG", qty: 12 },              // app baca ini
};
```

- `content` → untuk LLM reasoning
- `details` → untuk aplikasi/UI

## Aturan 12: Sub-agent di Pi (tanpa LangGraph)

3 pola:
1. **Sub-agent sebagai tool** — spawn Agent lain di dalam `execute`
2. **Parallel tool execution** — `toolExecution: "parallel"`
3. **Multiple Agent instances** — `Promise.all([...])`

Tapi tetap butuh LangGraph kalau:
- Perlu checkpoint/resume
- Workflow jam/hari
- Explicit state machine
- Visual graph debugging

## Aturan 13: Hybrid arsitektur (paling realistis)

Sebagian besar aplikasi butuh **REST + Agent**:

```
Klaster 1: READ HEAVY, FAST DISPLAY     → REST
Klaster 2: USER INTERACTION, REASONING   → Agent (Pi)
Klaster 3: AUTOMATION/BACKGROUND         → Worker + Agent
Klaster 4: REAL-TIME PUSH                → WebSocket + (optional) Agent
```

## Aturan 14: Penyimpanan conversation history

```typescript
// Load pesan lama saat agent dibuat
const messages = await loadMessagesFromDB(sessionId);
const agent = new Agent({ initialState: { ..., messages } });

// Save setelah response
agent.subscribe(async (event) => {
  if (event.type === "agent_end") {
    await saveMessagesToDB(sessionId, agent.state.messages);
  }
});
```

## Aturan 15: Cost awareness

- 1M token context = $3-15 per call
- RAG retrieve 2.000 token = $0.01
- Faktor 300-1000x lebih mahal kalau salah pilih

**Aturan:** jangan dump semua dokumen ke context. Pakai RAG untuk retrieve selektif.

## Aturan 16: Anti-pattern yang sering muncul

- ❌ Pakai agent untuk read-only simple display (pakai REST)
- ❌ Pakai LangGraph untuk single-agent simple loop (pakai Pi)
- ❌ Dump semua dokumen ke context (pakai RAG)
- ❌ Build MCP server cuma untuk 1 agent (pakai Pi tool langsung)
- ❌ Pakai Pi kalau cuma butuh 1 LLM call (pakai SDK langsung)
- ❌ Build agent loop sendiri kalau butuh hooks/multi-provider/state (pakai Pi)
