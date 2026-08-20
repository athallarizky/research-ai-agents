# 02 — Lanskap Framework: Perlukah LangChain?

> Pertanyaan asal: "apakah menggunakan framework seperti langchain?"

## Peta lima pendekatan

| Pendekatan | Inti abstraksinya | Cocok untuk | Untuk agent orkestrasi repo |
|---|---|---|---|
| **LangChain / LangGraph** | chain / graph eksplisit, ekosistem RAG (loaders, splitters, vector DB adapters) | pipeline data berat, alur multi-step deterministik, butuh observability LangSmith | overkill — tidak butuh chain 20 step, butuh satu agent yang bisa `git` + `curl` |
| **Framework multi-agent** (CrewAI, AutoGen) | peran + percakapan antar agent | simulasi tim, riset eksploratif | overkill — 90% task nyata lebih baik diselesaikan satu agent + tools bagus |
| **Agent SDK vendor** (mis. Claude Agent SDK) | loop + tools sungguhan (bash, file) + permission system | task agentic-coding: baca repo, edit file, jalankan command | paling fit — kebutuhan tools dan guardrail sudah builtin |
| **CLI headless** (`agent -p "..."`) | runtime agent sebagai proses sekali-jalan | task bounded, spawn per-job, tidak mau mengelola runtime | paling sederhana untuk server — cocok dengan pola webhook receiver |
| **API raw + loop sendiri** | tidak ada; ~100 baris loop buatan | belajar, kontrol penuh, eksperimen | viable, tapi tool execution, sandbox, context management, retry ditulis sendiri |

## Tesis: model as orchestrator

Untuk task yang sifatnya agentic-coding, model saat ini sudah menjadi
orchestrator yang lebih baik daripada graph yang dihardcode manusia. Graph
eksplisit bersinar ketika jalurnya memang harus dikunci (approval, komplain
determinisme, audit). Tapi untuk "baca repo ini, ikuti prosedur ini, buat PR",
menghardcode topologi berarti membatasi model pada masa lalu.

Ini konsisten dengan analisis Pi vs LangGraph di
[`../pi-agent-core/14-loop-mechanics-and-positioning.md`](../pi-agent-core/14-loop-mechanics-and-positioning.md):

| Aspek | LLM is the orchestrator | Code is the orchestrator |
|---|---|---|
| Control flow | loop tunggal implicit | graph eksplisit (nodes + edges) |
| Decision branching | tool selection oleh model | edge functions |
| Predictability | lebih rendah | lebih tinggi |
| Best for | task variatif (coding, riset) | approval flow, pipeline wajib audit |

Agent orkestrasi repo jelas kolom kiri: input-nya bervariasi (isi draft,
isi log, isi repo), output-nya satu (PR / issue / laporan).

Konteks historisnya juga menarik: LangChain besar di era model yang masih
perlu di-handhold — chain membantu model lemah tetap di jalur. Model
generasi sekarang tidak perlu digendong sejauh itu; abstraksinya paling
berguna justru di lapisan lain (context, harness, loop — lihat
[`../ai-terminology-map/02-engineering-stack.md`](../ai-terminology-map/02-engineering-stack.md)).

## Pemetaan ke stack: kebutuhan ada di layer mana?

Ini cara memutuskan yang lebih presisten daripada "framework mana yang populer":

```
Graph engineering   <- LangGraph hidup di sini (multi-agent, org/work graph)
Loop engineering    <- kebutuhan utama agent di server: trigger, isolasi, stop condition
Harness engineering <- Agent SDK / CLI headless hidup di sini (runtime + tools)
Context engineering <- skill Markdown, session interchange
```

Kebutuhan agent di server ada di **loop + harness** — jadi pilihan natural
adalah runtime agent (SDK/CLI), bukan framework graph. Posisi kompetitif
runtime semacam itu juga sudah dipetakan di `pi-agent-core/14`: pesaing
langsungnya Vercel AI SDK, Mastra, Claude Agent SDK — bukan LangChain.

## Kapan LangChain tetap masuk akal

Fair untuk kasus-kasus ini:

- **Poly-provider** — kebutuhan swap model antar vendor (GPT/Gemini/local)
  sebagai requirement utama, bukan opsional.
- **Observability** — ekosistem LangSmith sudah menjadi standar tracing tim.
- **Pipeline data, bukan orkestrasi repo** — RAG berat dengan banyak
  preprocessing (loaders, splitters, vector stores) memang wilayahnya.

Catatan: butuh RAG bukan berarti butuh LangChain untuk semuanya — pola
campuran juga valid (runtime agent + primitive RAG spesifik), seperti
dicatat di `pi-agent-core/14` bagian verdict.

## Rule of thumb

1. Alur sudah diketahui pasti dan wajib deterministik → **kode biasa /
   graph eksplisit** (workflow), bukan agent.
2. Task variatif, tools-nya level sistem (git/file/CLI/HTTP) → **runtime
   agent** (Agent SDK atau CLI headless).
3. Pipeline data dengan banyak tahap preprocessing → **LangChain/LangGraph**
   relevan di bagian itu.
4. Tergoda bikin tim multi-agent? Coba dulu **satu agent + tools bagus**;
   tambah agent hanya kalau ada alasan struktural (isolasi konteks,
   maker/checker).
5. Ingin kontrol penuh / belajar → loop API raw; sadari biayanya: semua
   infrastruktur loop ditulis dan dijaga sendiri.
