# AI Terminology Map — Kamus & Taksonomi Istilah AI

Riset tentang **bagaimana memilah istilah-istilah AI**: mana yang konsep, mana yang
metodologi, mana yang teknik, pattern, arsitektur, protokol, atau artifak.

Masalah awal (pertanyaan penulis):

> "Saya masih bingung terkait apa yang termasuk metodologi, konsep, dan lain
> sebagainya. Seperti graph atau loop engineering itu termasuk konsep atau metode?"

Jawaban singkat: **loop engineering dan graph engineering adalah metodologi
(disiplin engineering)**, bagian dari satu keluarga "X engineering" yang
bertumpuk sebagai layer. Detail di `02-engineering-stack.md`.

## Cara baca

**Mulai dari sini kalau baru baca:**
1. `01-taxonomy-framework.md` — 8 kategori istilah + cara memilah (decision tree)
2. `02-engineering-stack.md` — keluarga "X engineering": prompt → context →
   harness → loop → graph. Ini jawaban langsung untuk pertanyaan di atas
3. `05-glossary.md` — kamus A–Z, setiap istilah diberi tag kategori

**Topik spesifik:**
- `03-agent-patterns.md` — pattern & teknik agent (ReAct, Reflexion,
  orchestrator-workers, maker-checker, dst.)
- `04-standards-and-artifacts.md` — protokol, standar, konvensi, artifak
  (MCP, AGENTS.md, SKILL.md, session file)

## Intuisi utama

Istilah AI itu bukan satu jenis — paling tidak ada 8 jenis, dan masing-masing
menjawab pertanyaan berbeda:

| Pertanyaan yang dijawab | Kategori | Contoh |
|---|---|---|
| "Apa itu?" | Konsep | agent loop, context window, state |
| "Bagaimana cara pakai di satu titik?" | Teknik | few-shot, XML tagging |
| "Resep untuk masalah berulang?" | Pattern / metode | ReAct, orchestrator-workers |
| "Bagaimana kerangka kerja keseluruhan?" | Metodologi / disiplin | context engineering, loop engineering |
| "Bagaimana struktur sistemnya?" | Arsitektur | multi-agent system, RAG pipeline |
| "Apa kontrak antar sistem?" | Protokol / standar | MCP, A2A |
| "Apa benda konkret hasilnya?" | Artifak | AGENTS.md, SKILL.md, session file |
| "Bagaimana mengukurnya?" | Metrik / eval | pass@k, benchmark, evals |

Kunci memilah cepat: lihat **sufiks dan bentuk katanya** — akhiran
"-engineering" = metodologi; kata "pattern" = pattern; "protocol/standard/format"
= protokol; file `.md` / kode = artifak.

## Sumber utama

- Addy Osmani — [Loop Engineering](https://addyosmani.com/blog/loop-engineering/) (Juni 2026)
- MarkTechPost — [Prompt Engineering vs Loop Engineering vs Graph Engineering](https://www.marktechpost.com/2026/07/29/prompt-engineering-vs-loop-engineering-vs-graph-engineering/) (Juli 2026)
- Sarthak — [Harness, Graph, and Loop Engineering](https://sarthakai.substack.com/p/harness-graph-and-loop-engineering)
- Matt Turck — [LinkedIn: graph engineering is the new loop engineering](https://www.linkedin.com/posts/turck_graph-engineering-is-the-new-loop-engineering-activity-7493324529285660672-mAzI)

## Terkait

- [`../pi-agent-core/14-loop-mechanics-and-positioning.md`](../pi-agent-core/14-loop-mechanics-and-positioning.md) —
  implementasi konkret agent loop vs graph orchestrator di Pi
- [`../session-interchange-format/`](../session-interchange-format/) — contoh
  nyata artifak + protokol (format session portabel)
