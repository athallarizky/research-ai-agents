# Keluarga "X Engineering": Stack Prompt → Context → Harness → Loop → Graph

Semua istilah berakhiran "-engineering" di dunia agent adalah **metodologi /
disiplin** (kategori 4 di `01-taxonomy-framework.md`), dan mereka membentuk
**stack berlapis** — bukan pesaing yang saling menggantikan.

## Inti: unit of control

Cara termudah memilahnya: tiap layer punya **unit yang dikendalikan** berbeda.

| Layer | Unit of control | Kamu mendesain apa? | Scope | Contoh alat |
|---|---|---|---|---|
| **Prompt engineering** | satu respons model | instruksi terstruktur untuk satu panggilan | 1 panggilan | system prompt ber-tag XML |
| **Context engineering** | satu context window | token apa saja yang masuk window (retrieval, memory, tool output, state) | 1 window | RAG, memory, compaction |
| **Harness engineering** | satu runtime agent | lingkungan sekitar agent: file, tools, feedback | 1 agent | harness Claude Code, Pi |
| **Loop engineering** | satu siklus agent | loop observe-act-verify-recover + stop condition | 1 agent, tanpa supervisi | `/loop`, `/goal`, worktrees, skills |
| **Graph engineering** | organisasi banyak agent | dua graph: org graph (stabil) + work graph (efemeral) | multi-agent | LangGraph `StateGraph` |

## Progresi dan hubungan antar layer

```
+---------------------------------------------------+
| Graph engineering      : banyak agent             |
|   +-------------------------------------------+   |
|   | Loop engineering    : 1 siklus agent      |   |
|   |   +-----------------------------------+   |   |
|   |   | Harness engineering : 1 runtime   |   |   |
|   |   |   +---------------------------+   |   |   |
|   |   |   | Context eng. : 1 window  |   |   |   |
|   |   |   |   +-------------------+   |   |   |   |
|   |   |   |   | Prompt eng. :    |   |   |   |   |
|   |   |   |   | 1 respons        |   |   |   |   |
|   |   |   |   +-------------------+   |   |   |   |
|   |   |   +---------------------------+   |   |   |
|   |   +-----------------------------------+   |   |
|   +-------------------------------------------+   |
+---------------------------------------------------+
```

Prinsip: **tiap layer mempertahankan layer di bawahnya.** Prompt tidak hilang
begitu ada loop — ia berhenti diketik manual. Graph dibangun dari loop, loop
dibangun dari prompt (klaim paper Juli 2026, via MarkTechPost).

## Definisi per layer (ringkas)

### Prompt engineering
Menulis instruksi terstruktur untuk satu panggilan model: seksi berlabel
(background, instructions, tool guidance, output), dipisah tag XML / header
Markdown. Asumsinya: manusia membaca dan menilai tiap iterasi.

### Context engineering
Memperlakukan context window sebagai **resource terbatas** dan mengoptimalkan
token apa saja yang layak masuk — retrieval, memory, output tool, state.
"Where most loop quality is won or lost."

### Harness engineering
Mendesain lingkungan sekitar satu agent: file yang bisa diakses, tools,
memory, feedback loop, permission. Contoh nyata: Claude Code dan harness
open-source seperti Pi — lihat
[`../pi-agent-core/`](../pi-agent-core/).

### Loop engineering
Mendesain siklus agent yang berjalan tanpa supervisi: observe → act → verify →
recover. Definisi yang paling dikutip (Addy Osmani, Juni 2026): *"Loop
engineering is replacing yourself as the person who prompts the agent. You
design the system that does it instead."*

Lima primitifnya (per Osmani):
1. Automations (trigger)
2. Worktrees (isolasi)
3. Skills (`SKILL.md`)
4. MCP plugins / connectors
5. Sub-agents (maker/checker split)

Plus state eksternal (file markdown / board). Bagian tersulit: **stop
condition** — tanpa cek mekanis, "done" degenerate jadi "budget token habis".

### Graph engineering
Mendesain sistem multi-agent sebagai dua graph simultan:
- **Org graph** — stabil: siapa own apa, berubah saat redeploy
- **Work graph** — efemeral: edges split/merge/hilang selama eksekusi

Anthropic menyebut lima workflow patterns-nya (Des 2024) sebagai "graph
topologies described in prose". Implementasi khas: LangGraph (`add_node`,
`add_edge`, `add_conditional_edges`, `START`/`END`).

## Counterpoint (jangan telan bulat-bulat)

Ketika Anthropic memperbaiki koordinasi multi-agent yang gagal dengan ~50
subagent, solusinya adalah **prompting**, bukan topologi. Jadi: layer atas
tidak otomatis lebih penting — prompt tetap primary lever dalam banyak kasus
nyata. Stack ini deskriptif (memetakan unit of control), bukan hierarki
prestise.

## Evolusi istilah (lini masa ringkas)

| Kapan | Istilah yang naik | Pemicu |
|---|---|---|
| ~2022 | prompt engineering | chatbot one-shot jadi mainstream |
| ~2024 | context engineering | agent + window terbatas; posisi Anthropic |
| ~2025 | harness engineering | coding agent (Claude Code dsb.) matang |
| Juni 2026 | loop engineering | post Osmani; agen dijalankan berulang tanpa supervisi |
| ~2026 | graph engineering | LangGraph & multi-agent systems; Matt Turck: "graph engineering is the new loop engineering" |

Pola perhatian: tiap kali unit kerja naik satu tingkat (respons → window →
runtime → siklus → organisasi), lahirlah disiplin baru dengan sufiks
"-engineering". Bisa diprediksi: kalau unit berikutnya adalah "fleet of
systems" atau semacamnya, akan muncul istilah engineering baru lagi.

## Jawaban untuk pertanyaan awal

"Graph atau loop engineering itu termasuk konsep atau metode?"

**Keduanya metodologi (disiplin engineering)** — dengan objek kerja dan unit
of control berbeda:
- loop engineering → unit-nya satu siklus agent (intra-agent)
- graph engineering → unit-nya organisasi banyak agent (inter-agent)

"Konsep" yang dipelajari di dalamnya: agent loop, state machine, org/work
graph. "Metode"-nya: lima primitif loop, lima workflow patterns Anthropic.
Satu kata bisa menempati beberapa lapisan — lihat bagian "satu istilah,
banyak kategori" di `01-taxonomy-framework.md`.
