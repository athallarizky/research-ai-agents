# 06 — Pi sebagai Runtime Agent di VPS

> Pertanyaan asal: "apakah kita bisa menggunakan pi-core untuk agentic AI yang
> kita akan pasang di vps?"

## Kesimpulan

**Ya — dan secara analitis pilihan paling koheren dari semua opsi di
`02-framework-landscape.md`.** Alasannya tiga lapis:

1. **Layer yang tepat.** Kebutuhan agent server ada di loop + harness layer;
   Pi persis runtime loop+harness (bukan graph framework). Level 2
   kustomisasi Pi (`../pi-agent-core/04-customization-layers.md`) bahkan
   menyebut bentuk-bentuk yang identik dengan pola trigger kita: background
   job/worker (cron, queue consumer) dan HTTP API server.
2. **Fasilitasnya memetakan guardrail hampir satu-ke-satu** (tabel di bawah).
3. **Dua dari tiga alasan memilih LangChain lenyap** — poly-provider sudah
   builtin di `pi-ai`, RAG primitives tidak dibutuhkan; sisanya (observability
   LangSmith) tidak kritikal untuk server pribadi.

## Pemetaan guardrail -> fasilitas Pi

Kebutuhan dari `04-guardrails-and-security.md` versus apa yang disediakan
`../pi-agent-core/03-pi-architecture.md`:

| Kebutuhan guardrail | Fasilitas Pi |
|---|---|
| Tool allowlist | hanya `AgentTool` yang diregistrasi di `initialState.tools` — tool tidak terdaftar memang tidak bisa dipanggil |
| Audit trail | `beforeToolCall` / `afterToolCall` — docs Pi sendiri mencontohkan auth-check + auditLog di hook |
| Stop condition mekanis | `shouldStopAfterTurn` callback |
| Budget jaring pengaman | `thinkingBudgets` |
| Working directory terbatas | custom tool yang menentukan sendiri batas path-nya (tool `read_file` buatan sendiri yang mengikat path) |
| Poly-provider | `pi-ai` — Anthropic -> OpenAI -> lokal, ganti satu baris |
| Validasi input tool | TypeBox schema per tool, inference TypeScript gratis |

Twist yang menjadi argumen kuat: dengan custom tools TypeBox, agent Pi di
server **tidak perlu bash tool serba-bisa** — cukup daftarkan tool sempit
(`read_log`, `http_check`, `git_status`, `open_pr`). Itu persis filosofi
"tools sempit, auditable" dari `04-guardrails-and-security.md`, lebih ketat
daripada CLI headless yang default-nya punya shell.

## Arsitektur yang dihasilkan

```
VPS
|-- Fastify receiver (Pola A) / cron timer (Pola C)   <- tipis, tanpa kecerdasan
|     \-- spawn job
|           \-- new Agent({ ... })                     <- pi-agent-core, Level 2
|                 |-- systemPrompt: SKILLS.md (fs.readFile) + job brief
|                 |-- tools: allowlist sempit per jenis job
|                 |-- beforeToolCall: audit + policy
|                 |-- shouldStopAfterTurn: "ada nomor PR? selesai"
|                 \-- thinkingBudgets: plafon
\-- output: PR / issue                                  <- converge-via-PR tetap
```

Instruksi tetap file Markdown skill yang sudah ada di repo — masuk lewat
`systemPrompt` tanpa konversi. Satu-satunya yang dipadankan sendiri dibanding
Claude Agent SDK: skill file tidak auto-loaded (`fs.readFile` ke
systemPrompt, satu baris).

## Level Pi yang dipakai

| Level | Peran di sini |
|---|---|
| Level 1 — `pi-coding-agent` (CLI) | kandidat untuk job berbentuk coding agent penuh (draft-butler); tergantung open question di bawah |
| Level 2 — `pi-agent-core` (library) | **kandidat default** untuk job dengan tools sempit dan read-mostly |
| Level 3 — `pi-ai` saja | tidak perlu — berarti menulis loop sendiri tanpa alasan |

## Verdict per jenis job (dari `05-agent-ideas-catalog.md`)

| Jenis job | Runtime |
|---|---|
| Watchdog, stale-auditor, weekly digest, traffic insight (tools sempit, read-mostly) | pi-agent-core library — ideal |
| Draft-to-publish butler (butuh kekuatan coding agent penuh) | pi-coding-agent headless (`-p` / `--mode rpc`) dalam container ephemeral |

## Hasil verifikasi: headless dan permission (2026-08-20)

Diverifikasi langsung ke repo dan docs (README, CHANGELOG coding-agent,
docs SDK di pi.dev):

**Headless — terkonfirmasi, tiga tingkatan:**

| Mode | Bentuk |
|---|---|
| `pi -p` / `--print` | batch non-interaktif: input message/stdin -> stdout, tanpa TUI (setara `claude -p`) |
| `--mode json` | output JSON untuk konsumsi programatik |
| `--mode rpc` | proses headless yang di-drive via RPC — mengisi varian daemon long-lived dari `03-trigger-wiring.md` |

Mode non-interaktif melewati trust prompt yang muncul di mode interaktif.

**Permission — tidak ada, dan disengaja:**

- README: "Pi does not include a built-in permission system for restricting
  filesystem, process, network, or credential access" — default menjalankan
  agent dengan permission penuh user yang mengeksekusinya.
- Solusi resmi untuk boundary kuat: **containerize/sandbox** — tiga pola
  didokumentasikan: extension Gondolin (micro-VM Linux), Docker biasa,
  OpenShell.
- Allowlist konfiguratif ala `allowedTools` hanya via extension komunitas:
  `@pi-lab/permissions` (allow/deny/ask dari JSON config) dan
  `@aprimediet/permission-modes`.
- Preseden kehati-hatian — discussion #1655: project-scoped
  `shellCommandPrefix` dapat mengeksekusi perintah sebelum approval;
  approval berbasis config pernah bocor, container belum.

**Kontras filosofi dengan Claude Code:** CC = permission built-in, developer
opt-out; Pi = tanpa permission, developer opt-in via container. Pi memperlakukan
agent seperti program Unix lain — `curl` juga tidak minta izin. Boundary-nya
isolasi proses, bukan konfigurasi. Konsekuensi untuk arsitektur VPS:
**isolation level kernel > isolasi config** — container ephemeral per job
adalah permission boundary yang lebih kuat daripada flag `allowedTools`.

**SDK untuk penggunaan programatik (`createAgentSession`):**

- Factory tingkat tinggi di atas `new Agent()` — melapisi session lifecycle,
  message history, compaction, prompt templates, extensions, skills, queueing.
- `await session.prompt(...)` resolve setelah seluruh run selesai termasuk
  retries — semantik one-shot yang pas untuk cron.
- Opsi relevan: `tools: [...]`, `cwd`, `sessionManager`
  (`SessionManager.inMemory()` untuk run stateless).
- SDK juga mengekspor `runPrintMode` — "single-shot mode: send prompts,
  output result, exit".
- Pemakaian konkret pada desain watchdog: `07-cron-watchdog-design.md`.

Sumber: [repo pi](https://github.com/earendil-works/pi),
[CHANGELOG coding-agent](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/CHANGELOG.md),
[SDK docs — createAgentSession](https://pi.dev/docs/latest/sdk),
[@pi-lab/permissions](https://pi.dev/packages/@pi-lab/permissions),
[discussion #1655](https://github.com/earendil-works/pi/discussions/1655).

## Caveat dan open questions

1. **Tidak ada permission system prebuilt** seperti Agent SDK
   (`permissionMode`, `allowedTools`) — policy ditulis sendiri di hooks.
   Untuk kasus ini justru lebih bersih (allowlist = tools yang diregistrasi),
   tapi memang kerja sendiri, bukan diwarisi dari runtime.
2. **Headless `pi-coding-agent`: terverifikasi ada** (`-p`, `--mode json`,
   `--mode rpc`), tetapi permission-nya memang tidak ada bawaan — boundary
   kuat harus dari container, allowlist hanya via extension komunitas.
   Detail di bagian hasil verifikasi di atas.
3. **Maturity.** Proyek kecil dibanding SDK vendor — ditopang strict supply
   chain Pi (pinned deps, audit), tetap berarti maintenance jadi tanggungan
   sendiri.

## Terkait

- [`../pi-agent-core/03-pi-architecture.md`](../pi-agent-core/03-pi-architecture.md) —
  API surface yang dirujuk tabel pemetaan (Agent, hooks, event, provider)
- [`../pi-agent-core/04-customization-layers.md`](../pi-agent-core/04-customization-layers.md) —
  tiga level kustomisasi; Level 2 adalah pola arsitektur di file ini
- [`../pi-agent-core/14-loop-mechanics-and-positioning.md`](../pi-agent-core/14-loop-mechanics-and-positioning.md) —
  mekanika loop dan positioning Pi vs LangChain/LangGraph
- `02-framework-landscape.md` — peta lima pendekatan yang jadi latar file ini
- `04-guardrails-and-security.md` — daftar kebutuhan guardrail yang dipetakan
- `05-agent-ideas-catalog.md` — katalog ide yang jadi bahan verdict per job
