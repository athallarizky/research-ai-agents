# VPS Agent Patterns — Agent yang Berjalan di Server untuk Otomasi Repo

Riset tentang **menjalankan agent di server sendiri (VPS) yang dipicu dari repo** —
via workflow, webhook, atau jadwal — untuk mengotomasi pekerjaan seputar repo itu
sendiri: konten, maintenance, monitoring.

Pertanyaan awal (penulis):

> "apakah possible kita membuat agent yg jalan di repo ini? jadi bisa di trigger
> via workflow atau apapun, dan agentnya berjalan di vps, tapi kira-kira ide apa
> yang bisa dibuat ya?"

> "bagaimana konsep agent yg bisa dibuat? apakah menggunakan framework seperti
> langchain?"

Jawaban singkat: **bisa, dan tidak perlu framework berat.** Agent secara konsep
hanya loop + tools; untuk task orkestrasi repo (git, file, CLI, HTTP), model
sekarang sudah menjadi orchestrator yang lebih baik daripada graph yang
dihardcode — jadi pilihan naturalnya Agent SDK atau CLI headless, bukan
LangChain. Wiring trigger-nya punya tiga pola mapan: webhook receiver,
self-hosted runner, dan daemon + cron.

## Cara baca

1. `01-agent-concept.md` — anatomi agent: instructions, tools, loop, termination;
   beda workflow vs agent, dan kenapa definisi ini menentukan pilihan framework
2. `02-framework-landscape.md` — perlukah LangChain? Peta lima pendekatan
   (LangChain/LangGraph, framework multi-agent, Agent SDK, CLI headless,
   loop API raw) dan tesis "model as orchestrator"
3. `03-trigger-wiring.md` — tiga pola memicu agent di server: webhook receiver,
   self-hosted runner, daemon + cron/poll; plus konsep "agent resident"
4. `04-guardrails-and-security.md` — menjaga agent yang hidup di server:
   permission scoping, converge-via-PR, bounded run, secrets, biaya token
5. `05-agent-ideas-catalog.md` — katalog ide konkret (2026-08-20): watchdog,
   draft-butler, stale-content auditor, weekly digest, traffic insight —
   semua masih level ide, belum ada yang dibawa ke tahap design
6. `06-pi-as-vps-runtime.md` — penilaian pi-agent-core sebagai runtime
   (2026-08-20): pemetaan guardrail -> fasilitas Pi, verdict per jenis job,
   hasil verifikasi headless (`-p` / `--mode rpc`) dan permission (tanpa
   built-in; container sebagai boundary)
7. `07-cron-watchdog-design.md` — desain diskusi watchdog cron-jam
   (2026-08-20): `createAgentSession` sebagai entry one-shot, pembagian
   kerja workflow-vs-agent, agent tanpa tools, strategi issue + akun bot
   fine-grained PAT — level desain, belum terkunci
8. `08-testing-strategy.md` — strategi testing watchdog (2026-08-20):
   seam di tiap efek samping, piramida L0-L5 (fixture classify -> agent
   dry-run -> sandbox repo -> staging VPS), uji dedup + anti-halusinasi +
   negative test PAT

## Intuisi utama

Tiga kalimat yang merangkum topik ini:

1. **Agent = loop.** LLM dalam loop, diberi tools, memutuskan sendiri langkah
   berikutnya sampai task selesai. Framework hanyalah pembungkus loop ini.
2. **Orchestrator tipis, agent pintar, guardrail kental.** Trigger layer cuma
   spawn; kecerdasan ada di instruksi + tools; batas ada di permission.
3. **Agent resident, bukan agent invader.** Agent yang tinggal di server bisa
   membaca state lokal (log, DB, uptime) tanpa SSH dibuka ke luar — dia sudah
   di dalam, dengan capability yang di-scope sempit dan teraudit.

Posisi topik ini di stack "X engineering"
([`../ai-terminology-map/02-engineering-stack.md`](../ai-terminology-map/02-engineering-stack.md)):
praktiknya adalah **loop engineering** (automations/trigger, isolasi, stop
condition) di atas **harness engineering** (runtime + tools), dijalankan pada
satu server — bukan graph/multi-agent.

## Sumber utama

- Anthropic Engineering — [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- Anthropic — [Claude Agent SDK](https://docs.claude.com/en/api/agent-sdk/overview)
- LangChain — [LangGraph docs](https://langchain-ai.github.io/langgraph/)
- GitHub Docs — [Webhooks](https://docs.github.com/en/webhooks) dan
  [About self-hosted runners](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners)
  — bagian security
- Model Context Protocol — [modelcontextprotocol.io](https://modelcontextprotocol.io)

Daftar lengkap per topik ada di masing-masing file.

## Terkait

- [`../pi-agent-core/14-loop-mechanics-and-positioning.md`](../pi-agent-core/14-loop-mechanics-and-positioning.md) —
  mekanika agent loop (event lifecycle) dan positioning Pi vs LangChain/LangGraph;
  file ini memakai tabel positioning itu sebagai titik tolak
- [`../ai-terminology-map/02-engineering-stack.md`](../ai-terminology-map/02-engineering-stack.md) —
  stack prompt → context → harness → loop → graph; tempat istilah "loop
  engineering" dan lima primitifnya didefinisikan
- [`../huawei-wearable-agents/04-agent-architecture.md`](../huawei-wearable-agents/04-agent-architecture.md) —
  keputusan sejenis dari arah berbeda: otak agent juga tidak hidup di watch,
  melainkan di companion/HP; pola "thin client, otak di tempat yang layak"
