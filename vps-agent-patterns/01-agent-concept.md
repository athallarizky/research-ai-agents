# 01 — Konsep Dasar: Agent = Loop

> Pertanyaan asal: "bagaimana konsep agent yg bisa dibuat?"

## Anatomi agent

Satu agent, secara konseptual, cuma ini:

```
instructions (siapa kamu, pakai skill mana)
        |
        v
+---------------------------+
|  LLM memutuskan action    |<---------+
+------------+--------------+          |
             v                         |
    "aku mau jalankan tool X"          |
             |                         |
             v                         |
    executor menjalankan tool ---------+
    (bash / HTTP / baca file)   hasil masuk
                               context lagi
             |
             v
    task selesai -> output
```

Empat komponen:

| Komponen | Isi | Contoh |
|---|---|---|
| **Instructions** | identitas + prosedur yang diikuti agent | system prompt, `SKILLS.md`, `AGENTS.md` |
| **Tools** | kemampuan yang bisa dipanggil model | `bash`, baca/tulis file, HTTP request |
| **Executor** | kode yang benar-benar menjalankan tool + menyusun hasil balik ke context | runtime SDK, harness CLI |
| **Termination** | kapan loop berhenti | model berhenti memanggil tool, stop condition eksplisit, budget habis |

Yang sering bikin orang kaget: **instruksi agent tidak harus kode.** File
Markdown berisi prosedur langkah-demi-langkah (mis. `SKILLS.md` di sebuah repo)
sudah merupakan instruksi agent yang valid — model membacanya dan
mengeksekusinya lewat tools. Ini alasan skill tertulis di repo bisa langsung
menjadi "program" agent tanpa konversi ke framework apa pun.

## Workflow vs agent

Distingsi Anthropic (*Building effective agents*) yang jadi fondasi semua
keputusan berikutnya:

- **Workflow** — kode mengorkestrasi pemanggilan LLM lewat jalur yang
  sudah didefinisikan. Deterministik, mudah diaudit, cocok untuk proses
  yang bentuknya sudah diketahui.
- **Agent** — LLM sendiri yang mengorkestrasi: memilih tool, menentukan
  urutan, memutuskan kapan selesai. Fleksibel, cocok untuk task yang
  bentuknya tidak bisa diprediksi di muka.

Bukan hierarki bagus-buruk: kalau alurnya sudah diketahui pasti, workflow
(kode biasa, atau graph eksplisit) lebih tepat dan lebih murah. Agent baru
menang ketika variasi input terlalu besar untuk di-hardcode — misalnya
"polish draft artikel ini jadi entri siap-publish": struktur akhirnya
tergantung isi draft.

## Loop di balik runtime

Wujud konkret loop ini di sebuah runtime (Pi) sudah didokumentasikan di
[`../pi-agent-core/14-loop-mechanics-and-positioning.md`](../pi-agent-core/14-loop-mechanics-and-positioning.md):
turn-based ReAct loop dengan event lifecycle `agent_start → turn_start →
message_start → tool_execution_* → turn_end → agent_end`, state hidup di
array `messages`, dan branching terjadi "di kepala LLM" lewat tool selection.
Pseudocode intinya:

```
while not done:
    response = LLM(messages, tools)
    if response.has_tool_calls:
        results = execute_tools(response.tool_calls)
        messages += results          # hasil masuk context, loop lanjut
    else:
        done = true                  # model anggap selesai
```

Semua runtime agent — SDK resmi, harness CLI, framework — pada akhirnya
membungkus loop ini. Perbedaannya hanya di apa yang sudah mereka uruskan
(tool execution, permission, context management, resume) dan seberapa
tebal abstraksinya.

## Bagian tersulit: stop condition

Loop tanpa supervisi punya satu titik rawan: definisi "selesai". Tanpa cek
mekanis, "done" bisa degenerate menjadi "budget token habis" (waktu = uang).
Ini poin dari literatur loop engineering —
[`../ai-terminology-map/02-engineering-stack.md`](../ai-terminology-map/02-engineering-stack.md) —
dan alasan utama mengapa agent di server sebaiknya dijalankan sebagai
**job berbatas** (bounded run), bukan loop terbuka: satu trigger, satu task
terdefinisi, satu kondisi selesai yang bisa diverifikasi.

## Implikasi untuk agent di server

Dari konsep ini, tiga konsekuensi desain untuk agent yang berjalan di VPS:

1. Instructions berupa Markdown di repo sudah cukup — tidak ada "porting"
   ke framework. Yang dibutuhkan adalah runtime yang bisa membacanya.
2. Executor yang dibutuhkan adalah tools level sistem (bash, git, file,
   HTTP) dengan sandbox — bukan function Python yang di-register ke chain.
3. Desain yang paling menentukan bukan loop-nya (sudah ada di mana-mana),
   melainkan termination + permission: kapan dia berhenti dan apa saja
   yang boleh dia sentuh.
