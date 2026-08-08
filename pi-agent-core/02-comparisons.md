# 02 — Perbandingan: Pi vs LangChain vs LangGraph

## Tabel utama

| Kriteria | **LangChain + RAG** | **LangGraph + RAG** | **Pi + RAG** |
|---|---|---|---|
| Bentuk utama | Linear chain (DAG sederhana) | Multi-node graph dengan state | Single agent loop dengan tools |
| Cocok untuk | Pipeline RAG klasik (load → chunk → embed → retrieve → answer) | Multi-agent system, workflow kompleks dengan branch/loop | Agent custom yang butuh reasoning + tool use + human-in-loop |
| RAG sebagai apa? | Pipeline wajib, chain utama | Salah satu node di graph | **Salah satu tool** yang dipanggil agent saat perlu |
| Pre-built integrations | 80+ vector DB, document loaders, splitters | Sama + checkpointers (Postgres, Redis) | Sedikit — bikin wrapper sendiri |
| Type safety | Pydantic di Python, lemah di JS | Sama | TypeBox ketat di TS |
| Hook/middleware | Callbacks | Checkpoint + interrupt | `beforeToolCall` / `afterToolCall` clean |
| Multi-provider LLM | Bagus | Bagus | Bagus (`pi-ai`) |
| Coding-agent style | Tidak native | Bisa tapi canggung | Native (itu use case utama) |
| Multi-tenant deploy | Sulit | Sulit | Mudah (stateless server pattern) |
| Stream UI | Callback ribet | Sama | Event stream clean |
| Compliance/audit | Rakit sendiri | Sama | Telemetry hooks siap pakai |
| Production governance | Lebih untuk prototyping/exploration | Lebih untuk workflow complex | Lebih untuk produk custom |

## Rule of thumb cepat

| Situasi | Pakai |
|---|---|
| "Saya butuh RAG di atas 10.000 dokumen, jawab pertanyaan user" | **LangChain + RAG** |
| "Saya butuh 5 agent yang berkolaborasi: researcher, writer, reviewer, fact-checker, publisher" | **LangGraph** |
| "Saya butuh agent customer service yang panggil tool (DB, promo, order), reasoning, dan supervisor approve aksi kritis" | **Pi + RAG (sebagai tool)** |
| "Saya butuh coding agent internal untuk tim dev" | **Pi** |
| "Saya butuh automated workflow: terima email → klasifikasi → route ke 5 tim → tracking" | **LangGraph** |
| "Agent yang panggil tool berulang (loop + tools + streaming)" | **Pi** |
| "RAG pipeline, document loaders, vector DB, multi-chain DAG" | **LangChain** |
| "Multi-agent orchestration (A → B → C dengan conditional routing)" | **LangGraph** |

## Sering kombinasi

**Pi sebagai outer loop + LangGraph untuk sub-workflow kompleks di dalam tool**

Lihat `11-architecture-diagrams.md` untuk diagram kasus (a).

## Matriks fitur sub-agent

| Fitur | Pi-core | LangGraph |
|---|---|---|
| Single agent loop | Excellent | Bisa tapi canggung |
| Sub-agent via tool | Bisa | Bisa |
| Parallel tool exec | Built-in (`parallel` mode) | Fan-out/fan-in edges |
| **Explicit state machine** | Tidak (state implicit di messages) | Ya, typed state, edges, conditional routing |
| **Checkpointing (resume mid-workflow)** | Tidak native | Ya, Postgres/Redis checkpointers |
| **Visual graph debugging** | Tidak | Ya, LangSmith graph view |
| **Time travel (rewind state)** | Tidak | Ya, built-in |
| **Long-running workflow (jam/hari)** | Kurang cocok | Cocok |
| **Heterogeneous nodes** | Manual | Native |

## Diagram kompleksitas vs kapabilitas

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
