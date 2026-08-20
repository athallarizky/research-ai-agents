# 07 — Desain Diskusi: Cron Watchdog Agent dengan pi-agent-core

> Pertanyaan asal: "agent yg berjalan di vps menggunakan CRON setiap 1 jam,
> yang nantinya report akan disimpan ke github issue, saya akan buatkan satu
> akun github bot/dummy, yang nantinya akan diberi akses untuk write issues,
> lalu report terkait server akan disimpan di github issue. Apakah possible
> jika saya ingin menggunakan pi agent core? apakah pi agent core ini
> merupakan agent 'sekali jalan' yang bisa kita panggil by script? apakah
> kita akan menggunakan createAgentSession untuk menjalankan agent tersebut
> secara programatically?"

Status: **level desain (2026-08-20), belum terkunci** — pilihan strategi issue
masih terbuka (lihat bagian strategi issue). Sesuai scope repo: implementasi,
kalau jalan, dikerjakan di luar repo riset ini.

## Jawaban tiga pertanyaan

1. **Possible dengan pi-agent-core?** Ya — ini persis Pola C (cron) di
   `03-trigger-wiring.md` + ide #1 (watchdog) di `05-agent-ideas-catalog.md`.
2. **Agent "sekali jalan" yang bisa dipanggil script?** Ya, dirancang untuk
   itu. `await session.prompt(...)` resolve **setelah seluruh run selesai
   termasuk retries** — script jalan, buat session, prompt, terima hasil,
   proses exit. Tanpa daemon yang dijaga.
3. **Pakai `createAgentSession`?** Ya — entry point yang tepat (tingkat
   tinggi). SDK juga menyediakan `runPrintMode` (single-shot siap pakai)
   untuk kasus yang tidak butuh kode orkestrasi sendiri.

## Entry point yang tersedia (hasil verifikasi docs SDK)

| API / mode | Level | Kapan dipakai |
|---|---|---|
| `createAgentSession()` | tinggi | butuh session lifecycle + skills/extensions; opsi `tools`, `cwd`, `sessionManager` |
| `new Agent()` (`pi-agent-core`) | rendah | manipulasi state mentah; akses via `session.agent` |
| `runPrintMode` | siap pakai | prompt -> stdout, tanpa menulis orkestrasi |
| `pi --mode rpc` | proses hidup | varian daemon long-lived (di-drive via RPC) |

Untuk watchdog cron: `createAgentSession({ tools: [...], sessionManager:
SessionManager.inMemory(), model })` — `inMemory()` karena tiap run jamannya
stateless.

## Inti desain: pembagian kerja workflow vs agent

Aturan dari `01-agent-concept.md` (deterministik -> kode; fleksibel -> agent)
diterapkan ke alur:

```
crontab (tiap jam)
  \-- watchdog.mjs
        1. KODE: kumpulkan metrik (curl health, df, free, systemctl, journal tail)
        2. KODE: baca state.json (fingerprint anomali terakhir)
        3. KODE: gate — semua hijau & tanpa delta? -> heartbeat 1 baris, LOMPAT ke 5
        4. AGENT: createAgentSession -> prompt(metrik + state) -> laporan md terdiagnosis
        5. KODE: posting ke GitHub issue via token bot
        6. KODE: update state.json -> exit
```

### Temuan kunci: agent tanpa tools sama sekali

Karena metrik sudah terkumpul deterministik di langkah 1, tugas agent hanya
**mendiagnosis dan menulis laporan dari data yang disodorkan** — dia tidak
butuh tools. Konsekuensinya berantai:

- Token GitHub **tidak pernah dipegang agent** — posting dilakukan script.
  Satu-satunya output channel agent adalah string balikannya.
- Tanpa permission system (Pi memang tidak punya — lihat hasil verifikasi di
  `06-pi-as-vps-runtime.md`), tanpa container, tanpa permukaan serang:
  tidak ada yang bisa disalahgunakan.
- Gradient ekspansi tetap tersedia kalau nanti perlu: zero tools ->
  `tools: ["read"]` (agent menyelidik log sendiri, masih read-only) ->
  bash di dalam container (kasus ekstrem). Tiap naik tingkat = keputusan
  sadar menambah permukaan.

Formulasi umumnya: **agent sebagai otak diagnosis, script sebagai tangan.**
Semua efek ke dunia luar (menulis issue, membaca state) tetap di kode yang
deterministik dan bisa diaudit; LLM hanya menghasilkan teks.

### Gate deterministik = biaya nyaris nol

Server sehat jam demi jam adalah kasus membosankan. Kalau langkah 3 dapat
memutuskan "hijau semua, tanpa perubahan" tanpa LLM, panggilan model hanya
terjadi saat ada sesuatu (anomali / delta dari state sebelumnya). Dari 24
run/hari, mungkin hanya 2-3 yang sampai ke agent — "workflow first, agent
when needed" menjadi penghemat nyata.

## Strategi issue: masalah noise (belum diputuskan)

Report tiap jam apa adanya = 24 issue/hari = ~700/bulan — repo berubah jadi
tempat sampah. Tiga opsi:

1. **Anomaly-gated** — issue terbuka hanya saat state berubah (sehat ->
   bermasalah); comment untuk perkembangan; close saat pulih. Issue = alert
   yang actionable.
2. **Satu issue tracking + comment per run** — issue mingguan dibuat otomatis;
   tiap run append comment. Histori lengkap, nol spam, searchable.
3. **Kombinasi** — heartbeat hijau -> satu comment pendek di thread mingguan;
   anomali -> issue tersendiri berlabel `server-report`. Sehat dan sakit
   terpisah jelas.

Kandidat favorit diskusi: opsi 3. Apapun pilihannya, **dedup wajib**: sebelum
membuat issue, script mencari issue terbuka dengan fingerprint judul sama —
satu anomali = satu issue, bukan issue baru tiap jam selama anomali berlangsung.

## Akun bot: fine-grained PAT

- Gunakan **fine-grained PAT** dengan permission hanya **"Issues: read/write"**,
  di-scope ke satu repo — bukan classic PAT (`public_repo` terlalu luas).
- Worst case token bocor = spam issue di satu repo; tidak bisa baca kode,
  tidak bisa push.
- Identitas bot terpisah = audit jelas memisahkan laporan mesin vs manusia
  (poin `04-guardrails-and-security.md`).
- Rate limit GitHub untuk 24 run/hari trivial.

## Sketch instruksi agent

```
System: "Kamu ops analyst. Kamu menerima metrik server terformat.
Tulis laporan: status ringkas, anomali apa, diagnosis awal dari data
yang tersedia, saran tindakan. Format Markdown, maksimal N baris.
Jangan mengarang data yang tidak ada di input."

User: <metrik terformat + ringkasan state.json>
```

Tetap pasang plafon (`thinkingBudgets` / batas baris output) — laporan ops,
bukan esai. `shouldStopAfterTurn` default (model berhenti memanggil tool /
selesai menjawab) memadai karena tanpa tools.

## Keputusan yang masih terbuka

- [ ] Strategi issue: opsi 1 / 2 / 3
- [ ] Definisi "hijau" untuk gate (threshold metrik apa saja yang masuk)
- [ ] Set metrik yang dikumpulkan di langkah 1
- [ ] Akun bot dibuat (fine-grained PAT issues-only, scope satu repo)
- [ ] Ekspansi gradient tools: apakah anomali butuh agent membaca log sendiri
      (`tools: ["read"]`) atau journal tail di langkah 1 sudah cukup

## Terkait

- `03-trigger-wiring.md` — Pola C (cron) dan konsep bounded run
- `04-guardrails-and-security.md` — prinsip tools sempit + identitas bot;
  catatan container-vs-config di `06`
- `05-agent-ideas-catalog.md` — ide #1 watchdog, asal desain ini
- `08-testing-strategy.md` — cara menguji desain ini: fixture, dry-run,
  sandbox repo, naik-staging bertahap
- `06-pi-as-vps-runtime.md` — hasil verifikasi headless/permission/SDK
  (`createAgentSession`, `runPrintMode`, `--mode rpc`)
- [`../pi-agent-core/03-pi-architecture.md`](../pi-agent-core/03-pi-architecture.md) —
  API `Agent` tingkat rendah di bawah `AgentSession`
