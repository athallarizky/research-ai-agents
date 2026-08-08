# 03 — Arsitektur & API Surface Pi

## Tipe-tipe core

### `AgentMessage`
Tipe pesan fleksibel. Support standard LLM messages (`user`, `assistant`, `toolResult`) + custom app-specific types via declaration merging.

### `AgentState`
State agent. Berisi:
- `systemPrompt`
- `model`
- `thinkingLevel`
- `tools` (array of AgentTool)
- `messages` (array of AgentMessage)
- Streaming state (read-only)

### `AgentTool`
Definisi tool. Field:
- `name`
- `label`
- `description`
- `parameters` (TypeBox schema)
- `executionMode` (optional: `"sequential"` | `"parallel"`)
- `execute` function

## Class: `Agent`

### Constructor

```typescript
const agent = new Agent({
  // Required
  initialState: {
    systemPrompt,
    model,
    thinkingLevel?,  // optional
    tools?,          // optional
    messages?,       // optional
  },
  convertToLlm,        // function: AgentMessage[] → LLM Message[]
  transformContext,    // function untuk pruning/injecting context
  streamFn,            // REQUIRED — function untuk streaming LLM call
  
  // Optional
  steeringMode,        // default "one-at-a-time"
  followUpMode,        // default "one-at-a-time"
  sessionId,           // identifier
  getApiKey,           // dynamic auth
  toolExecution,       // "parallel" | "sequential"
  beforeToolCall,      // hook
  afterToolCall,       // hook
  shouldStopAfterTurn, // callback untuk termination control
  thinkingBudgets,     // token limits
});
```

### Methods

| Method | Fungsi |
|---|---|
| `agent.prompt(input)` | Kirim prompt (text / text+images / AgentMessage) |
| `agent.continue()` | Resume dari context yang ada |
| `agent.subscribe(handler)` | Event listener, return unsubscribe function |
| `agent.abort()` | Cancel operation berjalan |
| `agent.waitForIdle()` | Await completion |
| `agent.reset()` | Clear state |

## Definisi tool (TypeBox schema)

```typescript
import { Type } from "typebox";

const readFileTool: AgentTool = {
  name: "read_file",
  label: "Read File",
  description: "Read a file's contents",
  parameters: Type.Object({
    path: Type.String({ description: "File path" }),
  }),
  executionMode: "sequential",
  execute: async (toolCallId, params, signal, onUpdate) => {
    const content = await fs.readFile(params.path, "utf-8");
    
    // onUpdate optional — untuk progress streaming
    onUpdate?.({
      content: [{ type: "text", text: "Reading..." }],
      details: {},
    });
    
    return {
      content: [{ type: "text", text: content }],  // ← LLM baca ini
      details: { path: params.path, size: content.length },  // ← app baca ini
    };
  },
};
```

**Penting:** Tool errors harus di-`throw`, bukan di-return sebagai content.

## Setup minimal agent

```typescript
import { Agent } from "@earendil-works/pi-agent-core";
import { anthropicProvider, createModels } from "@earendil-works/pi-ai";

const models = createModels();
models.setProvider(anthropicProvider());
const model = models.getModel("anthropic", "claude-sonnet-4-6");

const agent = new Agent({
  initialState: {
    systemPrompt: "You are a helpful assistant.",
    model,
  },
  streamFn: models.streamSimple.bind(models),
});

agent.subscribe((event) => {
  if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
    process.stdout.write(event.assistantMessageEvent.delta);
  }
});

await agent.prompt("Hello!");
```

## Low-level API

Untuk kontrol lebih langsung:

```typescript
import { agentLoop, agentLoopContinue } from "@earendil-works/pi-agent-core";

// Direct loop control — async iterable of events
for await (const event of agentLoop(prompts, context, config, signal, streamFn)) {
  handleEvent(event);
}

// Continue from existing context
for await (const event of agentLoopContinue(context, config, signal, streamFn)) {
  handleEvent(event);
}
```

**Catatan:** Stream ini observational only. Untuk barrier semantics (menunggu event handler selesai sebelum tool preflight), gunakan class `Agent`.

## Event types (untuk subscribe)

| Event | Kapan dipakai |
|---|---|
| `agent_start` | Awal eksekusi agent |
| `agent_end` | Akhir eksekusi |
| `turn_start` | Awal satu turn (LLM call + tool execution) |
| `turn_end` | Akhir turn |
| `message_start` | Pesan baru dimulai |
| `message_update` | Update pada pesan (delta text, dsb.) |
| `message_end` | Pesan selesai |
| `tool_execution_start` | Tool mulai dieksekusi |
| `tool_execution_update` | Progress dari tool (via `onUpdate`) |
| `tool_execution_end` | Tool selesai |

## Hook system

Hook = middleware pattern (mirip Express middleware):

```typescript
const agent = new Agent({
  // ...
  beforeToolCall: async (tool, params, context) => {
    // Pre-execution: logging, auth check, validation
    await auditLog(tool.name, params, context.userId);
    if (!userCan(context.userId, tool.name)) {
      throw new Error("Forbidden");
    }
  },
  afterToolCall: async (tool, result, context) => {
    // Post-execution: metrics, cache, cleanup
    await metrics.increment(tool.name);
  },
});
```

## Provider abstraction (`pi-ai`)

```typescript
import {
  createModels,
  anthropicProvider,
  openaiProvider,
  googleProvider,
} from "@earendil-works/pi-ai";

const models = createModels();
models.setProvider(anthropicProvider());
models.setProvider(openaiProvider());
models.setProvider(googleProvider());

// Switch provider cukup ganti string
const model = models.getModel("anthropic", "claude-sonnet-4-6");
// atau
const model = models.getModel("openai", "gpt-4o");
// atau
const model = models.getModel("google", "gemini-2.5-pro");
```

## Pemetaan ke konsep yang dikenal

| Konsep JS/TS | Analog di Pi |
|---|---|
| `express()` instance | `new Agent(...)` |
| `app.use(middleware)` | `beforeToolCall` / `afterToolCall` |
| `app.get(path, handler)` | Define `AgentTool` dengan `execute` |
| `req` / `res` object | `agent.subscribe(event)` stream |
| React `useState` + `useEffect` | `AgentState` + `agent.subscribe` |
| Next.js API route | Tool definition |
| React Server Component | Agent running di backend |
| Client Component | React app calling agent API |
| tRPC procedure | Tool Pi dengan TypeBox schema |
| Sentry/logging middleware | `pi-telemetry` |
