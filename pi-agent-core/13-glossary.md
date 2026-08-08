# 13 — Glossary

Istilah-istilah kunci yang sering muncul di diskusi Pi dan ekosistem AI agent.

## Pi-specific

### `pi-agent-core`
Inti toolkit Pi. Library runtime untuk menjalankan agent loop, manage state, define tools, dan expose hooks. Bukan CLI — library yang kamu import ke aplikasi kamu sendiri.

### `pi-ai`
Layer abstraksi LLM multi-provider.统一 interface untuk OpenAI, Anthropic, Google, Azure, dll. Kamu cuma ganti string untuk switch provider.

### `pi-coding-agent`
Produk CLI siap pakai dari Pi. Mirip Claude Code. Salah satu konsumen `pi-agent-core`.

### `pi-server`, `pi-client`, `pi-protocol`
Tiga paket untuk deployment client/server. Server jalanin agent, client konsumsi via protocol (HTTP/WS).

### `pi-tui`
Terminal UI library dengan differential rendering. Dipakai `pi-coding-agent` untuk tampilannya.

### `pi-telemetry`
Vendor-neutral telemetry contracts. Hook observability untuk logging/metrics/tracing.

### `pi-evals`
Testing agent behavior secara sistematis. Untuk evaluate agent di berbagai test cases.

### `pi-session-backends`
Persistence layer. DB adapters untuk menyimpan session state.

## Core concepts

### Agent
Instance dari class `Agent` di Pi-core. Stateful, reactive, punya LLM, tools, dan loop.

### AgentState
State agent. Berisi: systemPrompt, model, thinkingLevel, tools, messages.

### AgentTool
Definisi tool. Punya name, label, description, parameters (TypeBox schema), executionMode, dan execute function.

### AgentMessage
Tipe pesan fleksibel. Support standard LLM messages (user, assistant, toolResult) + custom types via declaration merging.

### Hook
Middleware pattern. `beforeToolCall` dieksekusi sebelum tool jalan, `afterToolCall` setelahnya. Untuk logging, auth, validation, metrics.

### Subscribe
Event listener pattern. `agent.subscribe(handler)` return unsubscribe function. Untuk streaming events ke UI atau logging.

### Streaming events
Tipe event yang dipancarkan agent: `agent_start`, `agent_end`, `turn_start`, `turn_end`, `message_start`, `message_update`, `message_end`, `tool_execution_start`, `tool_execution_update`, `tool_execution_end`.

### TypeBox
Library TypeScript untuk define schema dengan type inference. Dipakai Pi untuk tool parameters. Alternatif zod, tapi lebih lightweight dan ecosystem-agnostic.

### `content` vs `details` (di tool return)
- `content` → dikembalikan ke LLM untuk reasoning
- `details` → metadata untuk aplikasi (UI, logging)

## Agent patterns

### Single agent loop
Satu agent yang punya LLM + tools + loop. Call LLM → milih tool → execute → loop. Pola paling dasar.

### Sub-agent
Agent lain yang dipanggil dari dalam tool agent utama. Untuk delegasi ke specialist.

### Multi-agent
Beberapa agent instance berjalan bersamaan (paralel atau sekuensial). Bisa via Promise.all atau LangGraph orchestration.

### Agentic RAG
Pola di mana RAG (vector search) dijadikan salah satu tool yang dipanggil agent saat perlu. Bukan pipeline utama, tapi tool selektif.

### Human-in-the-loop
Pattern di mana aksi tertentu butuh approval human sebelum dieksekusi. Implementasi di Pi: lewat `beforeToolCall` hook yang throw kalau belum di-approve.

### Parallel tool execution
Saat LLM request multiple tools sekaligus, semuanya dijalankan paralel. Pi punya built-in mode ini.

## Ekosistem & teknologi terkait

### LangChain
Orchestration framework untuk LLM. Pipeline RAG klasik, document loaders, vector DB integrations, chain composition. Lebih cocok untuk flow/dAG orchestration.

### LangGraph
Layer di atas LangChain untuk multi-agent graph workflow. Explicit state machine, checkpoint, branching, time travel. Cocok untuk workflow kompleks multi-day.

### LlamaIndex
Framework fokus RAG dan data ingestion. Kompetitor LangChain di RAG space.

### MCP (Model Context Protocol)
Protocol standard dari Anthropic untuk expose tools/resources ke LLM client. "Tools-as-a-Service". MCP server tidak punya LLM — cuma expose kapabilitas.

### MCP server
Server yang implement MCP protocol. Ekspos tools (baca file, query DB, search Confluence, dll) ke agent manapun yang mendukung MCP.

### MCP client
Layer di sisi agent yang konsumsi tools dari MCP server. Pi, Claude Code, Cursor punya MCP client built-in.

### Vector DB
Database khusus simpan embedding vector untuk similarity search. Contoh: pgvector, Qdrant, Pinecone, Weaviate, Milvus.

### Embedding
Representasi numerik (vector) dari text yang capture semantic meaning. Dipakai untuk semantic search di RAG.

### RAG (Retrieval-Augmented Generation)
Pattern: retrieve dokumen relevan → masukkan ke context → LLM generate jawab. Solves "LLM tidak tau data privat" dan context window limit.

### Agentic RAG
Variasi RAG di mana agent yang decide kapan retrieve, bukan pipeline fixed. RAG jadi salah satu tool.

### Checkpointing
Save state workflow di tengah eksekusi. Berguna untuk long-running workflow yang butuh resume setelah jam/hari.

### Fan-out / Fan-in
Pattern di LangGraph: satu node trigger multiple node paralel (fan-out), lalu kumpulkan hasilnya (fan-in).

### JSON-RPC
Wire protocol yang dipakai MCP untuk komunikasi antara client dan server.

### SSE (Server-Sent Events)
HTTP-based streaming protocol. Dipakai untuk stream LLM tokens ke client. Pi pakai ini via `res.setHeader("Content-Type", "text/event-stream")`.

## Konsep software engineering

### Forward Deployed Engineer (FDE)
Engineer yang deploy ke lokasi customer untuk build custom solution. Umum di Palantir, OpenAI. FDE ship cepat, integrate ke stack customer.

### Stateful vs Stateless
- **Stateful**: state disimpan di server antar request (Pi agent instance per session)
- **Stateless**: setiap request independent (REST API tradisional)

Pi agent bisa stateful (long-running) atau stateless (per request).

### Middleware
Pattern di Express/Hono/etc: function yang execute sebelum/sesudah handler utama. Logging, auth, rate limit, dll. Pi equivalen: `beforeToolCall` / `afterToolCall` hooks.

### TypeBox vs Zod
- **TypeBox**: schema sebagai object literal, lebih cepat, lebih portable
- **Zod**: schema sebagai chainable API, lebih ekspresif, lebih populer

Pi pakai TypeBox untuk tool parameters.

### Differential rendering
Teknik rendering UI terminal yang cuma update bagian yang berubah (bukan redraw semua). Dipakai `pi-tui`.

## Istilah bisnis/enterprise

### RBAC (Role-Based Access Control)
Model permission berdasarkan role. "Admin bisa X, user biasa hanya Y".

### ABAC (Attribute-Based Access Control)
Model permission berdasarkan atribut (user, resource, environment). Lebih granular dari RBAC.

### SSO (Single Sign-On)
Auth terpusat. User login sekali, akses multiple apps. Contoh: Okta, Auth0, Keycloak.

### Multi-tenancy
Satu instance aplikasi serve multiple customer (tenant) dengan data terpisah. Pi tidak desain untuk ini native — butuh effort di atas.

### SOC2 / HIPAA / ISO27001
Compliance certifications yang diminta enterprise. Pi (sebagai MIT open-source) tidak punya — tanggung jawab kamu sebagai FDE/vendor.

### SLA (Service Level Agreement)
Komitmen uptime/performance vendor. Pi tidak punya SLA komersial (open-source, org kecil).

### VPC (Virtual Private Cloud)
Private network di cloud. FDE sering deploy Pi ke VPC customer untuk data isolation.

## Singkatan

- **FDE**: Forward Deployed Engineer
- **MCP**: Model Context Protocol
- **RAG**: Retrieval-Augmented Generation
- **RBAC**: Role-Based Access Control
- **ABAC**: Attribute-Based Access Control
- **SSO**: Single Sign-On
- **SSE**: Server-Sent Events
- **SLA**: Service Level Agreement
- **VPC**: Virtual Private Cloud
- **SDK**: Software Development Kit
- **TUI**: Terminal User Interface
- **CLI**: Command-Line Interface
- **API**: Application Programming Interface
- **CRUD**: Create, Read, Update, Delete
- **LLM**: Large Language Model
- **JSON-RPC**: JSON Remote Procedure Call
