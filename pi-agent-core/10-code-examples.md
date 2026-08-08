# 10 — Contoh Kode: Express + Pi + React

## Setup dasar

```bash
npm install express @earendil-works/pi-agent-core @earendil-works/pi-ai typebox
```

## Backend: Express + Pi Agent (Customer Service API)

Skenario: CS agent Indomaret — cek stok, cek promo, status order.

```typescript
// server.ts
import express from "express";
import { Type } from "typebox";
import { Agent, type AgentTool } from "@earendil-works/pi-agent-core";
import { anthropicProvider, createModels } from "@earendil-works/pi-ai";

const app = express();
app.use(express.json());

// Setup LLM
const models = createModels();
models.setProvider(anthropicProvider());
const model = models.getModel("anthropic", "claude-sonnet-4-6");

// Define tools — seperti route handler
const checkStock: AgentTool = {
  name: "check_stock",
  description: "Cek stok produk berdasarkan SKU",
  parameters: Type.Object({ sku: Type.String() }),
  execute: async (_id, params) => {
    const row = await db.query(
      "SELECT qty FROM stock WHERE sku=$1", 
      [params.sku]
    );
    return {
      content: [{ type: "text", text: `Stok ${params.sku}: ${row.qty}` }],
      details: { sku: params.sku, qty: row.qty },
    };
  },
};

const checkPromo: AgentTool = {
  name: "check_promo",
  description: "Cek promo aktif untuk SKU",
  parameters: Type.Object({ sku: Type.String() }),
  execute: async (_id, params) => {
    const promo = await getActivePromo(params.sku);
    return { 
      content: [{ 
        type: "text", 
        text: promo || `tidak ada promo untuk ${params.sku}` 
      }] 
    };
  },
};

// Hook = middleware
const auditLog = async (event) => {
  if (event.type === "tool_execution_start") {
    await logToDB(event.toolName, event.params, userId);
  }
};

// API endpoint
app.post("/chat", async (req, res) => {
  const { message, userId } = req.body;

  const agent = new Agent({
    initialState: {
      systemPrompt: `Kamu CS Indomaret. User id: ${userId}.`,
      model,
      tools: [checkStock, checkPromo],
    },
    streamFn: models.streamSimple.bind(models),
    beforeToolCall: async (tool, params) => {
      if (!canUserAccess(userId, tool.name)) {
        throw new Error("Forbidden");
      }
    },
  });

  // Stream token ke client (SSE)
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  agent.subscribe((event) => {
    if (event.type === "message_update" 
        && event.assistantMessageEvent.type === "text_delta") {
      res.write(
        `data: ${JSON.stringify({ delta: event.assistantMessageEvent.delta })}\n\n`
      );
    }
  });

  await agent.prompt(message);
  res.end();
});

app.listen(3000, () => console.log("Server running on :3000"));
```

## Frontend: React component konsumsi agent stream

```tsx
// Chat.tsx
import { useState } from "react";

type Message = { role: "user" | "assistant"; text: string };

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [input, setInput] = useState("");

  async function send() {
    if (!input.trim() || streaming) return;
    
    const text = input;
    setInput("");
    setStreaming(true);
    setMessages(m => [...m, { role: "user", text }]);

    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, userId: "u123" }),
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    setMessages(m => [...m, { role: "assistant", text: "" }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value);
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const data = line.replace(/^data: /, "");
        if (data) {
          const { delta } = JSON.parse(data);
          setMessages(m => {
            const last = m[m.length - 1];
            return [
              ...m.slice(0, -1), 
              { ...last, text: last.text + delta }
            ];
          });
        }
      }
    }
    setStreaming(false);
  }

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>{m.text}</div>
        ))}
      </div>
      <div className="input-row">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Ketik pesan..."
          disabled={streaming}
        />
        <button onClick={send} disabled={streaming}>Kirim</button>
      </div>
    </div>
  );
}
```

## Pola 3: Pi Server + Multi-Client (untuk Indomaret)

### Server side

```typescript
// pi-server.ts
import { createServer } from "@earendil-works/pi-server";
import { Agent, type AgentTool } from "@earendil-works/pi-agent-core";

// Tools yang berinteraksi dengan HP Android via HTTP
const clickTool: AgentTool = {
  name: "click_button",
  parameters: Type.Object({ 
    selector: Type.String(),
    wait_ms: Type.Optional(Type.Number({ default: 500 })),
  }),
  execute: async (_id, params) => {
    // Kirim command ke AutoJs6 di HP via HTTP
    const res = await fetch("http://192.168.1.100:8080/click", {
      method: "POST",
      body: JSON.stringify({ selector: params.selector }),
    });
    const result = await res.json();
    return {
      content: [{ 
        type: "text", 
        text: `Click ${params.selector}: ${result.success ? "ok" : "failed"}` 
      }],
      details: result,
    };
  },
};

const readScreenTool: AgentTool = {
  name: "read_screen",
  parameters: Type.Object({}),
  execute: async () => {
    const res = await fetch("http://192.168.1.100:8080/screen");
    const ui = await res.json();
    return {
      content: [{ type: "text", text: JSON.stringify(ui.tree) }],
      details: ui,
    };
  },
};

const agent = new Agent({
  initialState: {
    systemPrompt: `Kamu agent automation Klik Indomaret. 
Tugas: bantu user checkout item di app Klik Indomaret.
Pakai tools untuk navigate, click, dan read screen.`,
    model,
    tools: [clickTool, readScreenTool, fillFormTool, navigateTool],
  },
  streamFn: models.streamSimple.bind(models),
  beforeToolCall: async (tool, params) => {
    // Log semua aksi untuk audit
    console.log(`[ACTION] ${tool.name}:`, params);
  },
});

// Expose via HTTP server
createServer({ agent, port: 4000 });
```

### HP Android side (Termux + AutoJs6)

```javascript
// autojs-agent-bridge.js (di AutoJs6)
http.createServer(8080, (req, res) => {
  if (req.path === "/click") {
    const { selector } = req.body;
    const el = selector().findOne(2000);
    if (el) {
      el.click();
      res.json({ success: true });
    } else {
      res.json({ success: false, error: "Element not found" });
    }
  }
  if (req.path === "/screen") {
    const tree = captureAccessibilityTree();
    res.json({ tree });
  }
});
```

### Web admin panel (React)

```tsx
// AdminPanel.tsx
export function AdminPanel() {
  const [tasks, setTasks] = useState<Task[]>([]);
  
  async function startTask(description: string) {
    await fetch("http://server:4000/api/task", {
      method: "POST",
      body: JSON.stringify({ description }),
    });
  }
  
  return (
    <div>
      <h1>Indomaret Automation Control</h1>
      <TaskInput onSubmit={startTask} />
      <TaskList tasks={tasks} />
      <LiveLog />
    </div>
  );
}
```

## Pola wiring dengan RAG (Agentic RAG)

```typescript
// RAG sebagai tool Pi agent
const searchKB: AgentTool = {
  name: "search_knowledge_base",
  parameters: Type.Object({ 
    query: Type.String(),
    top_k: Type.Optional(Type.Number({ default: 5 })),
  }),
  execute: async (_id, params) => {
    const embedding = await embed(params.query);
    const hits = await vectorDB.search(embedding, { 
      topK: params.top_k ?? 5 
    });
    const formatted = hits.map(h => 
      `[score: ${h.score.toFixed(2)}] ${h.doc.title}\n${h.doc.content}`
    ).join("\n\n---\n\n");
    return {
      content: [{ type: "text", text: formatted }],
      details: { sources: hits.map(h => h.doc.id) },
    };
  },
};

const agent = new Agent({
  initialState: {
    systemPrompt: "Kamu assistant internal. Cari di KB jika perlu.",
    model,
    tools: [searchKB, readDocumentTool, queryDBTool],
  },
  streamFn: models.streamSimple.bind(models),
});
```

## Tips implementation

### Tip 1: Conversation history persistence

```typescript
// Load pesan lama saat agent dibuat
const messages = await loadMessagesFromDB(sessionId);

const agent = new Agent({
  initialState: { ..., messages },
  // ...
});

// Save pesan baru setelah response
agent.subscribe(async (event) => {
  if (event.type === "agent_end") {
    await saveMessagesToDB(sessionId, agent.state.messages);
  }
});
```

### Tip 2: Rate limiting per user

```typescript
const agent = new Agent({
  // ...
  beforeToolCall: async (tool, params, context) => {
    const userId = context.userId;
    const count = await redis.incr(`ratelimit:${userId}:${tool.name}`);
    if (count === 1) await redis.expire(`ratelimit:${userId}:${tool.name}`, 3600);
    if (count > 100) throw new Error("Rate limit exceeded");
  },
});
```

### Tip 3: Cost tracking

```typescript
let totalTokens = 0;
let totalCost = 0;

agent.subscribe(async (event) => {
  if (event.type === "message_end" && event.usage) {
    totalTokens += event.usage.input + event.usage.output;
    totalCost += calculateCost(model, event.usage);
    await metrics.record({
      user: context.userId,
      tokens: event.usage,
      cost: calculateCost(model, event.usage),
    });
  }
});
```

### Tip 4: Abort/cancel handling

```typescript
const controller = new AbortController();

// Di client: kalau user cancel
app.post("/chat/cancel/:sessionId", async (req, res) => {
  const controller = activeSessions.get(req.params.sessionId);
  if (controller) {
    controller.abort();
    res.json({ cancelled: true });
  }
});

// Di agent
await agent.prompt(message, { signal: controller.signal });
```
