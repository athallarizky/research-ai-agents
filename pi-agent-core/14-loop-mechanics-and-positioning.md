# 14 — Agent Loop Mechanics & Positioning vs LangChain

## Bagian 1: Bagaimana Pi-core melakukan agent loop

Pi pakai **turn-based ReAct loop** (Reasoning + Acting).

### Struktur loop Pi

```
agent.prompt("user input")
       │
       ▼
┌─ agent_start event ─────────────────────────────────┐
│                                                      │
│  ┌─ turn_start ──────────────────────────────────┐  │
│  │                                                │  │
│  │  ┌─ message_start ──────────────────────────┐ │  │
│  │  │                                          │ │  │
│  │  │  Call LLM (streamFn)                     │ │  │
│  │  │  dengan: messages + tools + system prompt│ │  │
│  │  │                                          │ │  │
│  │  │  ┌─ message_update (text_delta) ───────┐ │ │  │
│  │  │  │  Stream token ke subscriber         │ │ │  │
│  │  │  └─────────────────────────────────────┘ │ │  │
│  │  │                                          │ │  │
│  │  └─ message_end (with optional tool_calls)─┘ │  │
│  │                                                │  │
│  │  if (tool_calls.length > 0):                  │  │
│  │    ┌─ tool_execution_start ─────────────────┐ │  │
│  │    │  for each tool_call:                   │ │  │
│  │    │    beforeToolCall(tool, params)        │ │  │
│  │    │    ┌─ tool_execution_update ─────────┐ │ │  │
│  │    │    │  result = await tool.execute()  │ │ │  │
│  │    │    └─────────────────────────────────┘ │ │  │
│  │    │    afterToolCall(tool, result)         │ │  │
│  │    │    append tool result to messages      │ │  │
│  │    └─ tool_execution_end ───────────────────┘ │  │
│  │                                                │  │
│  │  [loop back to turn_start]                    │  │
│  │                                                │  │
│  │  if (no tool_calls):                          │  │
│  │    shouldStopAfterTurn() check                │  │
│  │    → if true: exit                            │  │
│  │    → if false: wait for user (steering mode)  │  │
│  │                                                │  │
│  └─ turn_end ─────────────────────────────────────┘  │
│                                                      │
└─ agent_end event ───────────────────────────────────┘
```

### Properti kunci loop Pi

| Properti | Cara Pi |
|---|---|
| Orkestrasi | LLM yang decide (via tool selection) |
| State | Di `messages` array (implicit state) |
| Control flow | Loop tunggal, no branching |
| Decision "what next" | LLM yang milih tool atau stop |
| Loop termination | LLM stop call tools, atau `shouldStopAfterTurn` |
| Tool exec | Parallel atau sequential (config) |
| Concurrency | Per-agent (1 LLM call per turn) |
| Resume | `agent.continue()` dari messages existing |

### Pseudocode loop (sederhana)

```
function agentLoop(prompts, context, config, signal, streamFn):
  state.messages += prompts
  
  while not done:
    response = streamFn(state.messages, state.tools, state.systemPrompt)
    
    if response.has_tool_calls:
      results = execute_tools(
        response.tool_calls,
        mode=config.toolExecution  # "parallel" | "sequential"
      )
      state.messages += results
    else:
      if config.shouldStopAfterTurn(state):
        done = true
      else:
        # steering mode: "one-at-a-time" → wait for user
        yield control to user
```

### Low-level API

```typescript
import { agentLoop, agentLoopContinue } from "@earendil-works/pi-agent-core";

// Direct loop control — async iterable
for await (const event of agentLoop(prompts, context, config, signal, streamFn)) {
  handleEvent(event);
}

// Continue from existing context
for await (const event of agentLoopContinue(context, config, signal, streamFn)) {
  handleEvent(event);
}
```

**Catatan:** Stream ini observational only. Untuk barrier semantics (menunggu event handler selesai sebelum tool preflight), pakai class `Agent`.

### Event lifecycle

```
agent_start
  └─ turn_start
       ├─ message_start
       │   └─ message_update (text_delta)
       │       └─ message_end
       │
       ├─ tool_execution_start (if tool_calls)
       │   └─ tool_execution_update
       │       └─ tool_execution_end
       └─ turn_end
           └─ [next turn_start OR agent_end]
agent_end
```

---

## Bagian 2: Perbedaan fundamental Pi vs LangGraph

### Pi: LLM is the orchestrator

```
┌─────────────────────────────────────────┐
│  AGENT LOOP (built-in, implicit)        │
│                                         │
│  while not done:                        │
│    response = LLM(messages, tools)      │
│    if response.has_tool_calls:          │
│      results = execute_tools(response)  │
│      messages.append(results)           │
│    else:                                │
│      done = true                        │
└─────────────────────────────────────────┘
```

- **Tidak ada graph eksplisit** — loop sudah built-in
- **LLM milih jalur** lewat tool selection
- **State = conversation history**
- **Branching terjadi di kepala LLM**, bukan di kode

### LangGraph: Code is the orchestrator

```
┌─────────────────────────────────────────┐
│  EXPLICIT STATE GRAPH                   │
│                                         │
│  ┌──────┐                               │
│  │START │                               │
│  └──┬───┘                               │
│     ▼                                   │
│  ┌──────────┐                           │
│  │ classify │ ← function node           │
│  └────┬─────┘                           │
│       │                                 │
│   ┌───┴───┬─────────┐                   │
│   ▼       ▼         ▼                   │
│ ┌─────┐ ┌─────┐ ┌─────────┐             │
│ │legal│ │finance│ │compliance│  ← LLM nodes│
│ └──┬──┘ └──┬──┘ └────┬────┘             │
│    └───────┼─────────┘                  │
│            ▼                            │
│      ┌──────────┐                       │
│      │synthesize│ ← LLM node            │
│      └────┬─────┘                       │
│           ▼                             │
│      ┌──────────┐                       │
│      │  END     │                       │
│      └──────────┘                       │
└─────────────────────────────────────────┘
```

- **Graph eksplisit** — kamu define nodes + edges
- **Kode milih jalur** lewat conditional edges
- **State = typed schema** (bukan messages)
- **Branching di kode**, bukan di LLM

### Tabel perbedaan

| Aspek | Pi-core | LangGraph |
|---|---|---|
| Siapa orchestrator | LLM | Kode kamu |
| Control flow | Loop tunggal implicit | Graph eksplisit |
| State | Messages array | Typed state schema |
| Decision branching | LLM tool selection | Edge functions |
| Resume mid-way | Manual | Built-in (checkpoint) |
| Visual debugging | Tidak | LangSmith graph view |
| Heterogeneous nodes | Tidak (semua LLM) | Ya (LLM + function + human) |
| Setup effort | Rendah | Tinggi |
| Flexibility | LLM-driven | Deterministik |
| Predictability | Rendah (LLM ngambek) | Tinggi |
| Best for | Chat, Q&A, CS, coding agent | Approval flow, workflow, multi-team |

### Contoh kasus yang bikin beda jelas

**Task:** "User upload dokumen → klasifikasi → route ke tim yang relevan → approval → archive"

#### Pi approach (LLM-driven)

```typescript
// Semua di kepala LLM
const agent = new Agent({
  initialState: {
    systemPrompt: `Kamu document router. 
      Klasifikasi: legal/finance/operations.
      Pakai tools yang sesuai.`,
    tools: [routeToLegal, routeToFinance, routeToOps, archive, requestApproval],
  },
});

// LLM yang decide urutan tool call
await agent.prompt("Dokumen ini: ...");
```

**Masalah:**
- Tidak deterministik
- LLM bisa skip approval
- Sulit audit

#### LangGraph approach (code-driven)

```typescript
const graph = new StateGraph({
  state: Schema,
  nodes: {
    classify: classifyNode,        // pure function
    route: conditionalEdge(         // kode yang decide
      (state) => state.category,
      { legal: "legal_review", finance: "finance_review", ... }
    ),
    legal_review: legalAgentNode,   // LLM node
    finance_review: financeAgentNode,
    approval: humanCheckpoint,      // menunggu human
    archive: archiveNode,
  },
});

// Kode yang control flow, LLM hanya di node tertentu
```

**Keuntungan:**
- Deterministik
- Auditable
- Bisa resume kalau approval butuh 3 hari

---

## Bagian 3: Apakah Pi mencoba menyamakan konsep dari LangChain?

**Tidak. Pi sengaja positioning berbeda dari LangChain.**

### Bukti dari positioning Pi

| Aspek | LangChain | Pi |
|---|---|---|
| Tagline | "Framework for building LLM applications" | "AI agent toolkit: unified LLM API, agent loop, TUI, coding agent CLI" |
| Fokus utama | Orchestration chains/graphs | Agent runtime + coding agent |
| RAG primitives | 80+ integrations (loaders, splitters, vector DB) | Tidak ada |
| Document loaders | 100+ | 0 |
| Chain composition | LCEL (LangChain Expression Language) | Tidak ada |
| Output parsers | Banyak | Tidak ada |
| Memory classes | Multiple (ConversationBuffer, Summary, etc.) | Pakai messages array saja |
| Vector DB adapters | 80+ | 0 |
| Multi-agent | LangGraph | Sub-agent via tool |
| Coding agent CLI | Tidak ada | Ya (`pi-coding-agent`) |

### Yang TIDAK dimiliki Pi (yang jadi selling point LangChain)

- Document loaders
- Text splitters
- Vector DB adapters
- Output parsers
- Chain composition DSL (LCEL)
- Banyak memory class abstractions

Pi sengaja tidak mengikuti pola LangChain.

### Kompetitor sebenarnya Pi

Bukan LangChain. Kompetitor langsung Pi:

| Tool | Bahasa | Fokus |
|---|---|---|
| **Vercel AI SDK** | JS/TS | Streaming + agent primitives untuk web apps |
| **Mastra** | JS/TS | Agent framework production-grade |
| **LlamaIndex Agents** | JS/TS/Python | Agent runtime di atas RAG layer LlamaIndex |
| **AutoGen** | Python | Multi-agent conversation |
| **OpenAI Assistants API** | Hosted | Cloud equivalent (vendor locked) |
| **Claude Agent SDK** | JS/Python | Anthropic's official agent SDK |

Pi paling mirip **Vercel AI SDK + Claude Agent SDK** — runtime agent yang clean, multi-provider, dengan hooks dan streaming. Bukan framework orchestration.

### Yang overlap dengan LangChain (kompetisi langsung)

Hanya di area dasar agent:
- LLM abstraction (`pi-ai` vs `langchain.llms`)
- Tool definitions (`AgentTool` vs `langchain.tools`)
- Conversation memory (`messages` vs `langchain.memory`)

Tapi Pi lebih minimalis — tidak ada abstractions berlapis yang jadi ciri khas LangChain.

### Yang sama sekali beda (Pi unik)

- **Coding agent CLI siap pakai** (`pi-coding-agent`) — LangChain tidak punya
- **TUI library** (`pi-tui`) — LangChain tidak punya
- **Server/client/protocol split** — LangChain tidak punya native
- **Strict supply chain** (pinned deps, audit) — LangChain longgar

### Analogi positioning

| Framework umum | Setara di AI agent world |
|---|---|
| Spring Boot (framework lengkap dengan semuanya) | **LangChain** |
| Express.js (minimalist runtime, you build the rest) | **Pi** |
| Temporal/Airflow (workflow engine for complex flows) | **LangGraph** |

Mereka solve masalah berbeda, walaupun overlap di agent basics.

### Verdict

Pi **bukan**:
- "LangChain versi TypeScript"
- "LangChain pengganti"
- "LangChain dengan coding agent"

Pi **adalah**:
- Agent runtime yang minimalis
- Sengaja tidak punya banyak abstractions
- Fokus pada satu hal: loop + tools + hooks yang clean
- Dengan produk siap pakai (coding agent CLI) di atasnya

Kalau kamu pernah frustrasi dengan kompleksitas LangChain (terlalu banyak abstractions, susah debug, lifecycle membingungkan), Pi mungkin jawaban.

Kalau kamu butuh RAG primitives siap pakai, banyak integrasi vector DB, document loaders — LangChain masih lebih tepat.

Kombinasi (Pi sebagai runtime + LangChain untuk RAG primitives spesifik) juga valid.
