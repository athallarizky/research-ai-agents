# Kamus Istilah AI (A–Z) dengan Tag Kategori

Setiap istilah diberi tag kategori sesuai taksonomi di `01-taxonomy-framework.md`.
Tag: [konsep] [teknik] [pattern] [metodologi] [arsitektur] [protokol] [artifak]
[metrik]. Istilah yang wajar menempati lebih dari satu kategori diberi tag
ganda; kategori utama ditulis pertama.

## A–C

| Istilah | Kategori | Arti |
|---|---|---|
| Agent | [konsep] | sistem LLM yang bertindak goal-driven: memakai tools, mengamati hasil, mengulang sampai tujuan tercapai |
| Agentic RAG | [pattern] | retrieval sebagai tool yang dipanggil agent sesuai kebutuhan, bukan pipeline statis |
| AGENTS.md | [artifak] | file instruksi untuk agent di root repo; konvensi lintas tool |
| A2A (Agent-to-Agent) | [protokol] | standar komunikasi antar agent dari pihak/vendor berbeda |
| Benchmark | [metrik] | suite uji standar untuk membandingkan model/agent |
| Chain-of-thought (CoT) | [teknik] | meminta model menulis langkah penalaran sebelum jawaban akhir |
| Compaction | [teknik] | meringkas riwayat percakapan saat context window penuh supaya sesi bisa lanjut |
| Context engineering | [metodologi] | mengelola token apa saja yang masuk context window (retrieval, memory, state) |
| Context window | [konsep] | batas token yang bisa model "lihat" dalam satu panggilan |

## D–H

| Istilah | Kategori | Arti |
|---|---|---|
| Decomposition | [teknik] | memecah pertanyaan jadi sub-pertanyaan sebelum menjawab |
| Embedding | [konsep] | representasi vektor teks sehingga makin mirip makna makin dekat jaraknya |
| Evals | [metrik] | pengujian terukur perilaku agent/model terhadap kasus uji |
| Evaluator-optimizer | [pattern] | satu generator + satu pengkritik, iterasi sampai kriteria terpenuhi |
| Few-shot prompting | [teknik] | menyertakan contoh input-output di prompt agar model meniru pola |
| Fine-tuning | [teknik] | melatih ulang bobot model pada data spesifik (beda dari prompting: mengubah modelnya) |
| Function/tool calling | [protokol] | konvensi schema agar model bisa memanggil fungsi eksternal secara terstruktur |
| Graph | [konsep] | struktur node + edge; basis state machine workflow multi-agent |
| Graph definition | [artifak] | kode yang mendeklarasikan graph (mis. `StateGraph` LangGraph) |
| Graph engineering | [metodologi] | mendesain sistem multi-agent sebagai org graph (stabil) + work graph (efemeral) |
| Grounding | [konsep] | menjawab berdasarkan sumber nyata di context, bukan pengetahuan parametrik semata |
| Hallucination | [konsep] | output tampak meyakinkan tapi salah/dikarang |

## I–M

| Istilah | Kategori | Arti |
|---|---|---|
| Harness | [arsitektur] [artifak] | perancah di sekeliling model: tools, file, permission, loop, UI (mis. Claude Code, Pi) |
| Harness engineering | [metodologi] | mendesain runtime/harness satu agent |
| Inference | [konsep] | proses model menghasilkan output dari input |
| Loop engineering | [metodologi] | mendesain siklus agent tanpa supervisi (observe-act-verify-recover) + stop condition |
| Maker-checker | [pattern] | pembagi peran: satu agent mengerjakan, satu memverifikasi |
| MCP (Model Context Protocol) | [protokol] | standar terbuka konektivitas model ↔ tools/data lintas vendor |
| Memory | [konsep] [artifak] | penyimpanan konteks lintas sesi (episodik, semantik, file-based) |
| Metrik | [metrik] | angka pengukur kualitas (akurasi, latency, cost, pass@k) |
| Multi-agent system | [arsitektur] | beberapa agent berbagi tugas, berkoordinasi via orchestrator/graph |

## O–R

| Istilah | Kategori | Arti |
|---|---|---|
| Orchestrator-workers | [pattern] | orchestrator memecah tugas → workers paralel → agregasi |
| Pass@k | [metrik] | peluang minimal satu dari k sampel menjawab benar |
| Pattern (design) | [konsep] | resep berulang bernama untuk masalah berulang |
| Planner-executor | [pattern] | pisahkan penyusun rencana dari pelaksana |
| Prompt engineering | [metodologi] | menulis instruksi terstruktur untuk satu panggilan model |
| RAG (retrieval-augmented generation) | [arsitektur] [pattern] | perkaya context dengan hasil retrieval sebelum generate |
| Reasoning model | [konsep] | model yang melakukan penalaran panjang internal (extended thinking) |
| ReAct | [pattern] | loop Thought → Action → Observation sampai jawaban |
| Reflexion | [pattern] | evaluasi diri antar percobaan, evaluasi disimpan sebagai memory |
| Retrieval | [konsep] | mengambil dokumen/data relevan untuk context |

## S–Z

| Istilah | Kategori | Arti |
|---|---|---|
| Self-consistency | [teknik] | sample beberapa jalur penalaran, ambil mayoritas |
| Session file | [artifak] | konteks sesi tersimpan portabel (lihat session-interchange-format) |
| Skill / `SKILL.md` | [artifak] | paket instruksi + resource dimuat on-demand; primitif loop engineering |
| State | [konsep] | data yang membawa kondisi antar langkah/step graph |
| State machine | [konsep] [arsitektur] | model komputasi node-keadaan + transisi; dasar graph workflow |
| Stop condition | [konsep] [teknik] | cek mekanis kapan loop berhenti; bagian tersulit loop engineering |
| Sub-agent | [pattern] [arsitektur] | agent anak dengan konteks terisolasi; hasil ringkasannya kembali ke induk |
| System prompt | [artifak] | instruksi level sistem yang membingkai seluruh perilaku model |
| Temperature | [konsep] | parameter randomness sampling output |
| Token | [konsep] | unit teks terkecil yang diproses model (≈ kata/potongan kata) |
| Tool use | [konsep] | kemampuan model memanggil fungsi eksternal dari output terstruktur |
| Transcript (`.jsonl`) | [artifak] | log mentah sesi; bahan baku session file |
| Tree of Thoughts | [pattern] | eksplorasi cabang penalaran paralel + pemangkasan |
| Verifier | [pattern] [konsep] | komponen yang memeriksa output sebelum diterima (basis checker) |
