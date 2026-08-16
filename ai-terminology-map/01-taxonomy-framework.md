# Kerangka Taksonomi: 8 Kategori Istilah AI

Sumber kebingungan utama: istilah AI sering dibahas seolah satu jenis padahal
jenisnya beda. "ReAct" dan "context engineering" sama-sama "hal tentang agent",
tapi satu adalah pattern, yang lain metodologi. Memilah kategori dulu, baru
maknanya.

## Kategori

### 1. Konsep (Concept)

Unit pengetahuan / mental model. Menjawab **"apa itu?"**. Abstrak, dipahami,
bukan prosedur — tidak ada langkah yang bisa dijalankan.

- Ciri: bisa dijelaskan dalam satu-dua kalimat definisi; tidak menginstruksikan apapun
- Contoh: agent loop, context window, token, state, emergent behavior, grounding,
  hallucination, temperature

### 2. Teknik (Technique)

Taktik mikro yang dipakai **di satu titik** demi efek langsung. Menjawab
"bagaimana cara pakai di titik ini?". Prosedur kecil, langsung pakai, selesai.

- Ciri: satu langkah / satu trik; tidak menyusun sistem
- Contoh: few-shot prompting, chain-of-thought prompting, XML tagging di prompt,
  self-consistency, decomposition

Catatan: batas teknik vs pattern tipis. Pakai ukuran praktis: kalau bisa
dijelaskan dalam satu kalimat "lakukan X saat Y" = teknik; kalau perlu struktur
peran/langkah/aturan = pattern.

### 3. Pattern / Metode (Design Pattern / Method)

Resep berulang untuk masalah berulang. Menjawab **"bagaimana menyusun bagian
ini?"**. Punya struktur peran dan alur, tapi belum mengatur keseluruhan cara
kerja kamu.

- Ciri: nama yang dikenal luas + struktur tetap; bisa diimplementasi di framework apa pun
- Contoh: ReAct, Reflexion, Tree of Thoughts, planner-executor,
  orchestrator-workers, evaluator-optimizer, maker-checker

### 4. Metodologi / Disiplin (Methodology / Engineering Discipline)

Kerangka kerja sistemik yang mengatur **keseluruhan cara bekerja**, lengkap
dengan prinsip dan trade-off. Menjawab "bagaimana filosofi kerjanya?".

- Ciri: sufiks "-engineering"; berlapis (layer); tiap layer mempertahankan layer
  di bawahnya; menentukan apa yang kamu desain, bukan cuma bagaimana menulis
- Contoh: prompt engineering, context engineering, harness engineering,
  loop engineering, graph engineering

Ini kategori yang paling sering dikira "konsep" atau "metode" padahal beda:
metodologi adalah **disiplin**, sama seperti "software engineering" bukan
konsep pemrograman melainkan disiplin di atasnya.

### 5. Arsitektur (Architecture)

Struktur sistem: komponen dan relasinya. Menjawab **"bagaimana bentuk
sistemnya?"**. Blueprint, bukan prosedur dan bukan filosofi.

- Ciri: bisa digambar jadi diagram kotak-garis; menjelaskan pembagian komponen
- Contoh: multi-agent system, RAG pipeline, orchestrator-worker topology,
  client-server agent, monolithic harness

### 6. Protokol / Standar (Protocol / Standard)

Kontrak antar pihak supaya interoperable. Menjawab **"apa kesepakatannya?"**.
Tidak peduli implementasi, hanya format + semantics.

- Ciri: spesifikasi tertulis; diimplementasi banyak vendor berbeda
- Contoh: MCP (Model Context Protocol), A2A (agent-to-agent), function calling
  schema, session interchange format (yang di repo ini)

### 7. Artifak (Artifact)

Benda konkret hasil kerja: file, kode, konfigurasi. Menjawab **"apa benda
hasilnya?"**.

- Ciri: bisa di-`ls`, di-commit, di-diff
- Contoh: system prompt, AGENTS.md, SKILL.md, session file, graph definition
  (`StateGraph` di LangGraph), tool schema

### 8. Metrik / Evaluasi (Metric / Eval)

Cara mengukur. Menjawab **"bagaimana tahu ini bagus?"**.

- Ciri: angka / verdict + prosedur pengukuran
- Contoh: benchmark, evals, pass@k, token cost, latency, stop-condition check
  (bagian penting dari loop engineering)

## Decision Tree

```
Istilah baru masuk. Tanya berurutan:

1. File/kode konkret?                          → ARTIFAK
2. Kontrak antar sistem pihak ketiga?          → PROTOKOL / STANDAR
3. Cara mengukur kualitas?                     → METRIK / EVAL
4. Mendeskripsikan struktur & komponen sistem? → ARSITEKTUR
5. Sufiks "-engineering" / kerangka kerja
   menyeluruh + prinsip?                       → METODOLOGI / DISIPLIN
6. Struktur peran-langkah berulang untuk
   masalah berulang?                           → PATTERN / METODE
7. Satu trik, langsung pakai?                  → TEKNIK
8. Sisanya: definisi "apa itu"?                → KONSEP
```

Urutan sengaja: cek yang paling konkret dulu (artifak), paling abstrak
terakhir (konsep). Kebanyakan salah klasifikasi terjadi karena langsung
loncat ke "konsep".

## Sinyal sufiks / bentuk kata

| Sinyal | Kategori | Contoh |
|---|---|---|
| "X engineering" | Metodologi | context engineering, loop engineering |
| "X pattern" / nama metode terkenal | Pattern | ReAct, orchestrator-workers |
| "X protocol" / "X standard" / "X format" | Protokol | MCP, session interchange format |
| "X.md" / file / kode | Artifak | AGENTS.md, SKILL.md, StateGraph |
| "X benchmark" / "eval" / "@k" | Metrik | pass@k, HumanEval |
| frasa definisi tanpa prosedur | Konsep | context window, agent loop |

## Satu istilah, banyak kategori

Istilah yang sama bisa muncul di beberapa kategori tergantung **posisinya di
kalimat**. Ini normal dan menjadi sumber kebingungan utama.

Contoh: **loop**

- "agent loop" sebagai benda yang dipahami → **konsep**
- loop sebagai siklus observe-act-verify yang kamu desain → objek kerja dari
  **loop engineering** (metodologi)
- `/loop` command Claude Code → **artifak/fitur** yang mengimplementasikan metodologi itu

Contoh: **graph**

- "graph" sebagai struktur data → **konsep**
- graph definition `StateGraph` di kode LangGraph → **artifak**
- graph engineering → **metodologi** (desain org graph + work graph multi-agent)

Jadi pertanyaan "graph engineering itu konsep atau metode?" jawabannya:
**metodologi** — yang *objek kerjanya* (graph) adalah konsep, dan *hasil
kodenya* adalah artifak. Ketiganya terhubung vertikal, bukan saling eksklusif.

## Aturan praktis

1. Klasifikasi menempel pada **penggunaan**, bukan cuma kata
2. Saat membaca artikel baru, tandai tiap istilah baru dengan tag kategori —
   latihan tercepat melatih intuisi
3. Kalau ragu antara dua kategori, tanya: "apakah ini menentukan *apa yang saya
   desain* (metodologi) atau *bagaimana satu bagian dibuat* (pattern/teknik)?"
