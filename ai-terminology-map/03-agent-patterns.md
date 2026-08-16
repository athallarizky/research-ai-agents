# Pattern & Teknik Agent

Pattern (kategori 3) dan teknik (kategori 2) hidup DI DALAM metodologi
engineering — misalnya loop engineering memakai maker-checker, graph
engineering memakai orchestrator-workers. File ini memetakan yang paling sering
ditemui, dengan tag kategori eksplisit.

## Pattern (struktur peran + alur)

### ReAct [pattern]
Loop reasoning + acting bergantian: Thought → Action → Observation → repeat
sampai jawaban final. Fondasi kebanyakan agent loop modern. Meskipun papernya
2022, hampir semua coding agent hari ini masih ReAct di intinya.

### Reflexion [pattern]
Agent mengevaluasi hasilnya sendiri, menyimpan evaluasi sebagai "memory"
(episodik), lalu mencoba lagi dengan feedback itu. Beda dengan ReAct: ada
loop self-improvement antar percobaan, bukan cuma dalam satu percobaan.

### Tree of Thoughts (ToT) [pattern]
Menjelajahi beberapa cabang reasoning paralel, menilai tiap cabang, memangkas
yang lemah. Generalisasi chain-of-thought dari "satu jalur" jadi "pohon".
Mahal di token; dipakai untuk masalah search/planning berat.

### Planner-executor [pattern]
Pisahkan peran: satu agent menyusun rencana, agent lain mengeksekusi langkah
bergantian. Varian: plan lalu execute sekali (waterfall-ish), atau replan tiap
langkah ( dinamis).

### Orchestrator-workers [pattern]
Orchestrator memecah tugas, delegasikan ke worker paralel, lalu agregasi
hasilnya. Salah satu dari lima workflow patterns Anthropic (Des 2024). Di
LangGraph: topology graph dengan fan-out/fan-in.

### Evaluator-optimizer [pattern]
Satu agent menghasilkan, agent lain mengkritik, ulang sampai kriteria
terpenuhi. Versi ketat dari maker-checker dengan kriteria eksplisit.

### Maker-checker [pattern]
Dua sub-agent: maker mengerjakan, checker memverifikasi (misal dengan model
kecil terpisah). Dipakai untuk stop condition di loop engineering —
lihat `02-engineering-stack.md`.

### Agentic RAG [pattern]
Retrieval tidak jadi pipeline statis, tapi dieksekusi sebagai akses tool oleh
agent: agent memutuskan kapan mencari, query apa, dan apakah hasilnya cukup.
Contoh implementasi di
[`../pi-agent-core/06-pi-and-rag.md`](../pi-agent-core/06-pi-and-rag.md).

### Sub-agent / context quarantine [pattern]
Pecah tugas ke sub-agent supaya konteks kotor/menyita token tetap terisolasi
dari percakaan utama; hasil ringkasannya saja yang kembali. Alasan utamanya
manajemen context window, bukan pembagian keahlian.

## Teknik (satu trik, langsung pakai)

### Few-shot prompting [teknik]
Sertakan contoh input-output di prompt supaya model meniru format/polanya.

### Chain-of-thought (CoT) prompting [teknik]
Minta model menuliskan langkah penalaran sebelum jawaban akhir. "Let's think
step by step." Catatan 2026: banyak model reasoning modern melakukan ini
internal (extended thinking), jadi CoT eksplisit kadang redundant.

### Self-consistency [teknik]
Sample beberapa jalur reasoning, ambil jawaban mayoritas. Kombinasi umum
dengan CoT.

### Decomposition [teknik]
Pecah pertanyaan jadi sub-pertanyaan sebelum dijawab ("least-to-most").

### XML/Markdown structuring [teknik]
Beri label seksi prompt dengan tag XML atau header. Menurunkan ambiguitas
instruksi; prinsip dasar prompt engineering.

### Grounding via dokumentasi [teknik]
Sertakan dokumentasi/fakta relevan di context (file, hasil grep) alih-alih
andalkan pengetahuan parametrik. Inti dari mengapa agent membaca kode, bukan
menebak.

## Posisi pattern vs metodologi (peta silang)

```
Metodologi              Pattern yang hidup di dalamnya
----------------------  ---------------------------------------------
prompt engineering      structuring, few-shot, CoT
context engineering     RAG, memory, compaction, sub-agent quarantine
harness engineering     tool design, permission model, skills
loop engineering        maker-checker, Reflexion, automations+worktrees
graph engineering       orchestrator-workers, planner-executor, ToT
```

Cara baca tabel: pattern TIDAK dimiliki satu metodologi — ReAct bisa muncul di
harness maupun graph. Tabel hanya menunjukkan di mana pattern itu paling sering
jadi unit of control.

## Rambu-rambu klasifikasi

1. Kalau istilahnya menjelaskan **alur peran-langkah** → pattern
2. Kalau **satu kalimat trik** → teknik
3. Reasoning model (o-series, extended thinking) membuat beberapa teknik lawas
   (CoT eksplisit) bergeser ke "opsional" — istilah bisa turun relevansi tanpa
   berubah kategori
