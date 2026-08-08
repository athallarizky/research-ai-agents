# 07 — Pi dan MCP

## Pertanyaan kunci

> "Apakah kebanyakan MCP server dibuat dengan pola seperti Pi-core?"

**Tidak. MCP server dan Pi-core solve masalah yang berbeda.** Banyak orang kebingungan di sini.

## Perbedaan fundamental

| | **MCP Server** | **Pi agent-core** |
|---|---|---|
| Peran | Penyedia tool/resource ke LLM client | Konsumen tool + agent loop |
| Analogi | REST API server | Express app yang panggil REST API itu |
| Punya LLM? | **Tidak pernah** | Ya, itu inti |
| Punya agent loop? | Tidak | Ya |
| Output | JSON response tool call | Text + aksi ke user |

MCP server itu seperti **"Tools-as-a-Service"**. Dia expose kapabilitas (baca file, query DB, search Confluence) lewat protocol standard. **Nggak ada LLM, nggak ada reasoning.** Cuma eksekusi tool.

Pi agent-core itu **"Agent yang konsumsi tools"** — dia punya LLM, dia yang reasoning, dia yang milih tool mana dipanggil.

## Diagram relasi

```
[MCP Server A] ← tool call ← [Pi Agent] → tool call → [MCP Server B]
  (Slack tools)                  ↑                       (DB tools)
                              LLM call
                                 ↓
                            [Anthropic]
```

## Cara MCP server biasa dibuat

Biasanya cuma pakai MCP SDK + Zod, **tanpa agent library**:

```typescript
// MCP server minimal — tidak ada LLM, tidak ada Pi
import { Server } from "@modelcontextprotocol/sdk/server";
import { z } from "zod";

const server = new Server({ name: "stock-mcp", version: "1.0" });

server.setRequestHandler("tools/call", async (req) => {
  if (req.params.name === "check_stock") {
    const { sku } = z.object({ sku: z.string() }).parse(req.params.arguments);
    const row = await db.query("SELECT qty FROM stock WHERE sku=$1", [sku]);
    return { content: [{ type: "text", text: `Stok: ${row.qty}` }] };
  }
});
```

**Mirip secara struktur** (schema + handler) tapi **beda domain**:
- MCP server = microservice kecil yang expose tool, nggak peduli siapa panggil
- Pi agent-core = orchestrator yang punya LLM, milih tool mana dipanggil

## Bisa Pi jadi MCP server? / Bisa Pi konsumsi MCP?

Ya dua-duanya:
- `pi-server` bisa expose agent sebagai MCP server (jadi agent kamu jadi tool untuk agent lain)
- Agent Pi bisa pakai MCP tools (ada tool wrapper yang translate MCP → Pi tool schema)

Tapi **default-nya MCP server tidak pakai Pi**, dan **Pi tidak butuh MCP** untuk kerja (bisa langsung pakai tool lokal).

## Kapan MCP berguna

MCP berguna kalau kamu ingin **interoperabilitas antar agent ecosystem**:
- Claude Code bisa pakai tool kamu
- Cursor bisa pakai
- Agent kamu bisa pakai tool eksternal

## Kapan pakai MCP

- Punya 3+ agent platform yang butuh tool sama
- Tool di-maintain oleh tim berbeda
- Mau ekspos tool ke eksternal (partner/customer dengan agent sendiri)
- Ingin tool catalog terpusat untuk organisasi

## Kapan TIDAK perlu MCP

- Cuma 1 agent → taruh tool langsung sebagai Pi tool (lebih simpel, lebih cepat, no network hop)
- Tool cuma dipakai di satu aplikasi
- Pertimbangkan latency: MCP call = network/IPC overhead vs direct function call

## Sequence flow: Pi konsumsi MCP

```
USER: "Bikin tiket Jira untuk bug login, kasih tau tim #eng di Slack"

PI AGENT (LLM reasoning):
│
├─ [1] Intent: buat ticket + notify channel
├─ [2] Plan:
│      • Step A: call jira.create_ticket
│      • Step B: call slack.send_msg (with ticket_id dari A)
│
├─ [3] Eksekusi Step A:
│      PI ──MCP call──▶ jira-mcp.create_ticket({
│                          title: "Bug login",
│                          priority: "P2"
│                      })
│                          │
│                          ▼
│                    jira-mcp execute:
│                      └─ POST jira.com/rest/api/2/issue
│                          │
│                          ▼
│                      return { ticket_id: "ENG-1234" }
│                          │
│      PI ◀──MCP response──┘
│
├─ [4] Eksekusi Step B:
│      PI ──MCP call──▶ slack-mcp.send_msg({
│                          channel: "#eng",
│                          text: "Bug login dilaporkan: ENG-1234"
│                      })
│                          │
│                          ▼
│                    slack-mcp execute:
│                      └─ POST slack.com/api/chat.postMessage
│                          │
│                          ▼
│                      return { ok: true, ts: "..." }
│                          │
│      PI ◀──MCP response──┘
│
└─ [5] Synthesize response ke user:
       "Tiket ENG-1234 dibuat. Sudah kirim notif ke #eng."
                          │
                          ▼
                       USER
```

## Hubungan dengan arsitektur multi-agent

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
    │   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
    └──────────┼─────────────────┼─────────────────┼──────────┘
               │                 │                 │
               │   MCP protocol (JSON-RPC)         │
               │                 │                 │
    ╔══════════╪═════════════════╪═════════════════╪════════╗
    ║   ┌──────▼─────────────────▼─────────────────▼──┐     ║
    ║   │        MCP CLIENT LAYER                     │     ║
    ║   └──────┬─────────────────┬─────────────────┬──┘     ║
    ║          │                 │                 │         ║
    ║   ┌──────▼─────┐    ┌──────▼─────┐    ┌──────▼───┐    ║
    ║   │ PI AGENT   │    │ CLAUDE CODE│    │ CURSOR   │    ║
    ║   │ (app kamu) │    │ (CLI)      │    │ (IDE)    │    ║
    ║   └─────┬──────┘    └────────────┘    └──────────┘    ║
    ╚═════════╪═════════════════════════════════════════════╝
              │
              ▼
       ┌──────────────┐
       │  Anthropic   │
       │  API         │
       └──────────────┘
```
