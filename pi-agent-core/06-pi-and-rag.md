# 06 — Pi dan RAG

## Pertanyaan kunci

> "Kalau Pi bisa baca dokumen dan human-in-loop, apakah artinya kita sudah tidak perlu RAG?"

**Jawaban: Tidak. Pi dan RAG solve masalah yang berbeda, bukan alternatif.**

## Akar kebingungan: "baca dokumen" ≠ "cari dokumen"

Pi tool `read_file` bisa baca dokumen yang **sudah diketahui** path-nya. Tapi di enterprise, masalah utamanya bukan baca — masalahnya **cari** dokumen mana yang relevan dari 10.000+ dokumen.

| Pertanyaan | Yang jawab |
|---|---|
| "Baca kontrak_X.pdf dan extract clause" | **Pi** (tool baca dokumen) |
| "Dari 50.000 kontrak, mana yang punya clause force majeure seperti kasus ini?" | **RAG** (semantic search) |

## Kenapa context window besar tidak hilangkan RAG

Misconception umum: "Gemini punya 1M-2M context, kan tinggal masukin semua". Realitanya:

1. **Biaya**: 1M token per query = $3-15 per call. RAG retrieve 2.000 token = $0.01. Faktor 300-1000x lebih mahal.
2. **Akurasi**: "Lost in the middle" — LLM sering miss informasi di tengah context panjang. RAG selektif = signal-to-noise lebih baik.
3. **Latency**: 1M token = 30-60 detik first token. RAG = 1-3 detik.
4. **Skala**: enterprise knowledge base 10M+ dokumen. Nggak cukup context window manapun.

## Kapan Pi saja cukup (tanpa RAG)

- Dokumen sedikit (< 50, muat di context)
- Path/ID dokumen sudah diketahui dari task ("baca PO-2024-1234")
- Structured data — query SQL/REST API langsung lebih akurat daripada RAG
- Live data — stok Indomaret real-time → query DB, bukan RAG

## Kapan RAG tetap wajib

- Corpus besar (ribuan dokumen)
- User tidak tahu dokumen mana relevan ("temukan kasus serupa")
- Semantic search ("policy yang mirip dengan kasus X")
- Compliance — harus cite sumber dokumen spesifik
- Multi-modal dokumen (PDF dengan tabel, scan, gambar)

## Pola terbaik: Agentic RAG (Pi + RAG)

Ini yang jadi industry standard. RAG dijadikan **tool** yang dipanggil Pi agent:

```typescript
import { Type } from "typebox";
import type { AgentTool } from "@earendil-works/pi-agent-core";

const searchKnowledgeBase: AgentTool = {
  name: "search_knowledge_base",
  description: "Cari dokumen relevan di knowledge base internal",
  parameters: Type.Object({
    query: Type.String({ description: "Pertanyaan atau topik pencarian" }),
    top_k: Type.Optional(Type.Number({ default: 5 })),
  }),
  execute: async (_id, params) => {
    // Embed query
    const embedding = await embed(params.query);
    
    // Vector search
    const hits = await vectorDB.search(embedding, { topK: params.top_k ?? 5 });
    
    // Format hasil untuk LLM
    const formatted = hits.map(h => 
      `[${h.score.toFixed(2)}] ${h.doc.title}\n${h.doc.content}`
    ).join("\n\n");
    
    return {
      content: [{ type: "text", text: formatted }],
      details: { 
        hits_count: hits.length,
        sources: hits.map(h => h.doc.id),
      },
    };
  },
};
```

## Keuntungan Agentic RAG

- **Agent retrieve hanya saat perlu** → hemat cost
- **Agent bisa iterate** → query pertama jelek? Query lagi dengan term berbeda
- **Agent bisa combine** → baca knowledge base + query live DB + call API, semua dalam satu loop
- **Human-in-loop hooks** → sebelum aksi kritis, supervisor approve

## Contoh konkret: bank scenario

User tanya: *"Kalau nasabah meninggal, siapa yang berhak claim saldo tabungan cuma-cuma?"*

### RAG-only
Cari dokumen policy → return top-5 chunks → LLM jawab.
**Masalah:** tidak cek status nasabah, tidak cek saldo.

### Pi-only (tanpa RAG)
Agent harus tau dulu dokumen mana yang relevan. Kalau ada 1000 policy/prosedur → stuck.

### Pi + Agentic RAG
1. Agent panggil `search_policy("claim tabungan nasabah meninggal")` → RAG return 3 dokumen
2. Agent baca detail 3 dokumen itu via `read_document`
3. Agent panggil `check_customer_status(accountId)` → live DB
4. Agent combine policy + status → jawab + cite sumber
5. `beforeToolCall` hook → jika aksi transmit uang, supervisor approve

## Verdict

**RAG tetap perlu.** Pi bahkan bikin RAG lebih kuat karena:
- RAG jadi salah satu tool, bukan satu-satunya jalur
- Agent bisa retrieve iteratif
- Human-in-loop di hook, bukan di workflow terpisah

Untuk aplikasi enterprise: kalau ada corpus dokumen besar (SOP, contract, knowledge base), **RAG wajib**. Pi adalah layer di atasnya yang orchestrate kapan retrieve, kapan query DB langsung, kapan tanya human.
