# 04 — Layer Kustomisasi Pi

Pi punya 3 layer yang bisa kamu pilih sesuai kebutuhan. Bukan "hanya CLI wrapper" — tergantung layer mana yang dipakai.

## Level 1: Pakai `pi-coding-agent` langsung

**Bentuk:** produk CLI siap pakai (mirip Claude Code)

```
┌─────────────────────────────────┐
│  pi (CLI command)               │
│  ├─ config (.pi/pi-config.json) │
│  ├─ custom tools (jika perlu)   │
│  └─ system prompt (customize)   │
└─────────────────────────────────┘
```

- Pakai langsung sebagai binary/CLI
- Customize via config + tambah tool
- Tetap berbentuk CLI
- **Tidak perlu kode kalau cuma butuh config**

## Level 2: Pakai `pi-agent-core` (library)

**Bentuk:** aplikasi custom (bukan CLI) — ini yang sering dipakai

```
┌─────────────────────────────────────┐
│  Aplikasi kamu (Express/Next/Hono)  │
│  ├─ import { Agent } from pi-core   │
│  ├─ define tools sendiri            │
│  ├─ define system prompt sendiri    │
│  └─ expose via HTTP/WS/cron/job     │
└─────────────────────────────────────┘
```

Bisa dibentuk jadi:
- HTTP API server (`/v1/chat`)
- WebSocket service (real-time chat produk)
- Background job/worker (cron, queue consumer)
- Embedded di aplikasi Node.js (Next.js/Hono/Express route)
- Worker queue consumer (RabbitMQ/Kafka/SQS)
- MCP server (agent sebagai tool untuk agent lain)
- Mobile backend (HP client, server jalanin Pi)
- Batch processing (paralel dokumen)

**Ini layer utama yang dipakai untuk produk custom.**

## Level 3: Pakai `pi-ai` saja (LLM abstraction)

**Bentuk:** cuma butuh LLM abstraction multi-provider, agent loop sendiri

```typescript
import { createModels, anthropicProvider } from "@earendil-works/pi-ai";

const models = createModels();
models.setProvider(anthropicProvider());
const model = models.getModel("anthropic", "claude-sonnet-4-6");

// Loop agent kamu tulis sendiri
while (true) {
  const response = await models.streamSimple({...});
  // ...
}
```

Dipakai kalau:
- Cuma butuh ganti-ganti provider mudah
- Sudah punya agent loop sendiri
- Mau integrate ke framework lain

## Analogi

**Pi itu seperti Express.js untuk AI agent.**

| Express | Pi |
|---|---|
| HTTP server framework | Agent runtime framework |
| `app.get("/x", handler)` | `agent.subscribe(handler)` |
| `app.use(middleware)` | `agent.beforeToolCall = hook` |
| `req.body` / `res.json()` | `agent.prompt()` / event stream |
| Express app instance | Agent instance |

Express bukan aplikasi, Pi juga bukan agent. Express kamu kasih bentuk (REST, SSR, WS, GraphQL). Pi juga — kamu kasih bentuk (CLI, API, worker, mobile backend).

## Analogi: Agent itu "useState di server, plus tools"

```typescript
// React: stateful + reactive
const [count, setCount] = useState(0);
useEffect(() => console.log(count), [count]);
setCount(10);

// Pi: stateful + reactive + bisa "berpikir"
const agent = new Agent({ initialState, streamFn });
agent.subscribe(event => console.log(event));  // seperti useEffect
await agent.prompt("halo");                    // seperti setState
```

Bedanya: Agent bisa **memutuskan** sendiri tool apa yang dipanggil. `useState` cuma simpan state pasif.

## Tiga pola arsitektur umum (untuk stack React/Express)

### Pola A: Monolith Next.js

```
Next.js app (app/api/chat/route.ts)
  └─ pakai pi-agent-core langsung di route handler
  └─ React component konsumsi via fetch
```

**Cocok:** MVP, internal tool, project kecil.

### Pola B: Express API + React SPA

```
Express server (port 3000)
  └─ pi-agent-core + tools (DB access, dll)
  
React SPA (port 5173)
  └─ fetch/SSE ke /chat
```

**Cocok:** tim separate frontend/backend, scaling beda.

### Pola C: Pi-server + multi-client (paling fleksibel)

```
Pi-server (Node.js)
  └─ agent loop + tools
  └─ expose via pi-protocol (HTTP/WS)

Clients:
  ├─ React web (pi-client)
  ├─ React Native mobile
  └─ AutoJs6 Android (HTTP manual)
```

**Cocok untuk konteks Indomaret automation:** backend terpusat, HP Android control, web admin panel.

## Twist: kapan JANGAN pakai Pi

Pertanyaan jujur: *"Kenapa nggak langsung pakai Anthropic SDK + Express? Buat loop-nya sendiri kan cuma 50 baris?"*

**Betul untuk kasus sederhana.** Pi berguna saat kamu butuh:

1. **Multi-provider swap** — pindah Anthropic → OpenAI → Azure → lokal cuma ganti 1 baris
2. **Hook system** yang konsisten (`beforeToolCall`, `afterToolCall`)
3. **Streaming event** yang well-defined — nggak perlu debug parsing delta tiap provider
4. **State management** untuk conversation panjang + compaction
5. **TypeBox schemas** → tool input validation + TypeScript inference gratis
6. **Evals** untuk test agent behavior secara sistematis

Kalau use case cuma "user chat → agent jawab → selesai", skrip 50 baris pakai Anthropic SDK cukup. Pi berguna saat agent **rumit** (banyak tool, multi-provider, perlu audit, perlu test).

## Verdict

Stack React + Express + TypeScript **langsung kompatibel**. Nggak ada mental shift besar. Pi cuma nambah satu konsep baru (agent loop yang panggil tool sendiri), sisanya pola yang sudah dikenal.
