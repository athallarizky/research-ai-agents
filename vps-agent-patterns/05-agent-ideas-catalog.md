# 05 — Katalog Ide Agent untuk Otomasi Repo

> Pertanyaan asal: "kira-kira ide apa yang bisa dibuat ya?"

Konteks pembanding yang memicu katalog ini: repo situs personal (frontend
statish + CMS headless + deploy lewat CI), dengan pipeline konten yang sudah
terprosedur (skill Markdown di repo: polish artikel, generate entri project
dari repo sumber). Katalog ini level ide — belum ada yang dibawa ke tahap
design, sesuai scope repo riset.

## Ringkasan

| # | Ide | Trigger | Akses | Risiko | Nilai/effort |
|---|---|---|---|---|---|
| 1 | Watchdog / ops agent | cron 5–15 mnt | read-only | sangat rendah | tertinggi |
| 2 | Draft-to-publish butler | webhook (issue/branch draft) | tulis via PR | rendah | tinggi |
| 3 | Stale-content auditor | cron mingguan | read-only | sangat rendah | tinggi |
| 4 | Weekly digest bot | cron Jumat | baca repo, tulis draft | rendah | sedang |
| 5 | Traffic insight agent | cron malam / on-demand dashboard | baca analytics (read-only tool), usulan | sedang | sedang — backlog menunggu event collection |

Urutan yang disarankan: mulai dari yang paling read-only untuk memvalidasi
pola trigger → agent (lihat `03-trigger-wiring.md`) sebelum mempercayakan
pekerjaan yang menulis.

## 1. Watchdog / ops agent

- **Trigger:** cron 5–15 menit (Pola C).
- **Kerja:** cek uptime situs, health endpoint CMS, disk, error log. Saat ada
  anomali: baca log sekitar kejadian, diagnosis, buka issue berisi
  root-cause analysis + saran perbaikan.
- **Output:** issue / notifikasi. Tanpa anomali: diam.
- **Kenapa mulai dari sini:** read-only penuh, tidak menyentuh pipeline
  konten, dan memvalidasi seluruh pola trigger-spawn-output dengan risiko
  minimum.

## 2. Draft-to-publish butler

- **Trigger:** webhook — issue berlabel / commit ke branch draft (Pola A).
- **Kerja:** jalankan skill polish yang sudah ada di repo (terjemahkan bila
  perlu, rapikan struktur, generate artefak siap-import), buka PR berisi
  hasilnya.
- **Output:** PR siap review. Tidak pernah merge sendiri.
- **Daya tariknya:** ini mempromosikan skill tertulis yang sudah ada
  menjadi produk nyata — drop draft kasar (mis. dari HP via issue), PR rapi
  datang kemudian. Instruksi = file Markdown yang sudah teruwa; tidak ada
  kode orkestrasi baru yang berarti.

## 3. Stale-content auditor

- **Trigger:** cron mingguan (Pola C).
- **Kerja:**Enumerasi semua link eksternal pada konten published (repo
  sumber, URL demo), deteksi 404/redirect mencurigakan, screenshot mati,
  tech yang usang.
- **Output:** maintenance issue terstruktur (per konten, per jenis masalah).
- **Catatan:** penyakit klasik portfolio umur panjang — link demo mati
  diam-diam. Deteksinya mekanis (bisa juga script biasa); bagian agent-nya
  adalah klasifikasi & laporan yang enak dibaca.

## 4. Weekly digest bot

- **Trigger:** cron Jumat (Pola C).
- **Kerja:** agregasi aktivitas git lintas repo pribadi selama seminggu —
  apa yang di-ship, apa yang bergerak — lalu menyusun draf tulisan
  "week in review" atau update halaman status.
- **Output:** draft konten (PR atau entri draft di CMS).
- **Catatan:** membuat situs pribadi self-documenting. Bagian yang layak
  agent: menyaring mana yang layak cerita dari sekadar noise commit.

## 5. Traffic insight agent

- **Trigger:** cron malam (Pola C) untuk laporan rutin; **evolusi 2026-08-20:**
  varian on-demand via dashboard situs — pola trigger ketiga (app-triggered:
  dashboard -> API route backend sendiri -> spawn agent), belum ada di
  `03-trigger-wiring.md`.
- **Kerja:** tarik data analytics (pageviews, referrer, funnel), ringkas
  tren, usulkan tindakan (mis. konten mana yang layak ditonjolkan).
- **Output:** laporan berkala privat + usulan perubahan sebagai issue;
  varian dashboard: hasil disimpan ke collection laporan (persist, bisa
  dibandingkan antar periode) dan dirender di dashboard.
- **Akses data (evolusi 2026-08-20):** agent membaca DB lewat **satu tool
  `query` read-only dan table-scoped** — koneksi SQLite `mode=ro` (guarantee
  level filesystem) + allowlist tabel analytics/konten; **bukan** tabel
  `users`/`media`. Bukan akses DB mentah. Tool boundary = audit log +
  seam testing (arahkan ke DB fixture).
- **Prasyarat (belum ada):** event collection (pageview, click per slug +
  timestamp) harus dibangun dulu — pekerjaan produk murni, terlepas dari
  agent-nya. **Status: backlog sampai infrastruktur event ada.**
- **Penempatan:** repo portfolio (fitur produk — lihat catatan penempatan
  di bawah), bukan repo ops.
- **Catatan:** satu-satunya ide yang menyentuh data pengunjung — butuh
  kehati-hatian ekstra (PII, retensi). Usulan menulis ke config situs
  harus tetap lewat jalur review.

## Penempatan implementasi (diskusi 2026-08-20)

Aturan satu kalimat: **agent yang merawat server -> repo ops; agent yang
menganalisis/melayani produk -> ikut repo produknya.**

| Agent | Repo implementasi | Alasan |
|---|---|---|
| Watchdog, stale-auditor, digest (ops, server-scoped) | repo ops terpisah (mis. `vps-agents`) | reusable lintas project; kredensial & issue tracker terisolasi; lifecycle terpisah dari release produk |
| Traffic insight / analytics agent | repo portfolio | coupled ke schema konten + integrasi dashboard; fitur produk, bukan tooling |

Anti-over-engineering: repo terpisah bukan framework — mulai dari satu agent
concrete, share-by-copy, ekstrak shared helper baru setelah agent ketiga
(rule of three).

## Pola umum di balik kelimanya

Semua ide mematuhi bentuk yang sama:

```
trigger (event/jadwal)
   -> spawn agent bounded (satu task, tool allowlist)
   -> hasil lewat jalur review (issue / PR / draft)
   -> manusia memutuskan
```

Tidak ada yang menggantikan keputusan manusia; yang diganti adalah pekerjaan
mengumpulkan, memeriksa, dan merapikan bahan sebelum keputusan itu diambil.
Itu batas yang disengaja — alasan guardrail-nya dibahas panjang di
`04-guardrails-and-security.md`.

## Kriteria naik kelas

Ide naik dari katalog ke tahap design kalau (mengacu checklist audit di
`04-guardrails-and-security.md`):

1. task-nya bisa didefinisikan sebagai satu job bounded dengan output
   terverifikasi mekanis;
2. ada pola trigger yang jelas (event apa / jadwal apa);
3. tool allowlist minimum-nya bisa ditulis sekarang;
4. kegagalan terburuknya diketahui dan dapat diterima.
