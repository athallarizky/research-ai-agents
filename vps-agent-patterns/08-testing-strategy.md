# 08 — Strategi Testing: Simulasi Issue Server Sampai Report di GitHub Issue

> Pertanyaan asal: "bagaimana kita melakukan testing fitur agent tersebut
> untuk simulasikan ada issue di server dan sampai mengirim report ke
> github issue?"

Status: level desain (2026-08-20), pendamping
`07-cron-watchdog-design.md`.

## Prinsip: kasih "jahitan" (seam) di tiap efek samping

Pembagian workflow-vs-agent dari file 07 otomatis menghasilkan pola testing
berlapis: tiap sisi mahal/berisiko (panggilan LLM, penulisan ke GitHub)
diputus dan diuji sendiri-sendiri. Konkritnya, script didesain supaya tiga
titik ini bisa diganti lewat flag/env:

```
collect()   -->  [seam 1: --metrics-file fixtures/xxx.json]  ganti pengumpulan live
agent       -->  [seam 2: --dry-run / canned response]        ganti panggilan LLM
postIssue() -->  [seam 3: --dry-run / --repo sandbox]         ganti penulisan GitHub
```

## Piramida L0-L5

### L0 — uji `classify()` + gate (gratis, milidetik)

`classify()` pure function: metrik + state masuk, verdict keluar. Berikan
fixture JSON per skenario:

```
fixtures/
├── healthy-flat.json        # semua hijau, tanpa delta -> gate TIDAK memanggil agent
├── disk-90.json             # threshold breach (merah)
├── service-failed.json      # systemctl failed
├── cert-expiring.json       # sertifikat < 14 hari
├── healthy-with-delta.json  # nilai aman tapi berubah dari state (kuning)
└── flapping.json + state    # muncul-hilang-muncul -> kena dampening
```

Yang diuji di layer ini (semua kebijakan hidup di sini):

- fixture -> verdict yang benar (threshold, delta, dampening, baseline run
  pertama)
- `healthy-flat` -> **agent tidak pernah terpanggil** — pakai mock agent yang
  throw jika terpanggil

### L2 — uji agent (LLM nyata, tanpa GitHub)

```bash
node watchdog.mjs --metrics-file fixtures/disk-90.json --dry-run
```

Agent jalan beneran; laporan ke-print/stdout atau ke file; tidak ada yang
dikirim. Yang dicek:

- **Anti-halusinasi**: fixture tanpa data CPU -> laporan tidak boleh
  menyebut CPU; hanya data yang ada di input
- Kepatuhan format: Markdown, maksimal N baris, ada bagian diagnosis + saran
- Golden output: review manual sekali per fixture; kalau mau sistematis,
  Pi punya paket `evals` untuk ini

### L3 — uji posting + dedup (repo sandbox)

Repo GitHub private buangan sebagai sandbox; token bot di-scope tambah ke
repo ini. Skenario berurutan:

1. Jalankan fixture `disk-90` -> expect **1 issue** terbuka, label benar
2. Jalankan **lagi fixture sama** -> expect **comment di issue yang sama**,
   bukan issue baru (dedup fingerprint bekerja)
3. Ganti ke fixture `service-failed` -> expect **issue baru** (fingerprint
   beda)
4. Pemulihan: fixture sehat + state "sedang merah" -> expect issue di-close
   dengan laporan pemulihan

Plus **negative test** murah tapi berharga: pakai token bot untuk `git push`
ke sandbox -> harus **403** (bukti fine-grained PAT benar-benar cuma
issues:write).

### L4-L5 — naik ke VPS bertahap

- **L4 staging**: cron nyata di VPS, `collect()` nyata, posting masih
  `--dry-run`. Berjalan beberapa hari -> verdict stabil, tidak ada false
  positive jam 3 pagi
- **L5 produksi**: ganti target ke repo asli, gate aktif

## Ringkasan

| Layer | Yang diuji | LLM | GitHub | Biaya |
|---|---|---|---|---|
| L0 | kebijakan gate, threshold, delta, logika dedup | tidak | tidak | nol |
| L2 | kualitas laporan agent, anti-halusinasi | ya | tidak | per-run |
| L3 | posting nyata, dedup, label, close-on-recovery, scope PAT | opsional | sandbox | nol |
| L4 | cron + collect nyata | ya | dry-run | kecil |
| L5 | semuanya | ya | repo asli | on-anomaly |

Catatan penting:

- **L0-L3 bisa dikerjakan di laptop** tanpa VPS — `collect()` hanya membaca
  sistem lokal; tidak ada yang spesifik-VPS di script
- Dua seam utama muncul **gratis dari desain** (agent tidak pegang koneksi
  GitHub; collect deterministik), bukan dari effort testing tambahan
- Kalau suatu saat butuh anomali sungguhan di staging VPS (bukan fixture):
  stop service non-kritis, atau arahkan health-check ke port tertutup —
  dengan fixture, kebutuhan ini hampir hilang

## Terkait

- `07-cron-watchdog-design.md` — desain yang diuji (gate, fingerprint, dedup,
  akun bot)
- `04-guardrails-and-security.md` — prinsip tools sempit yang membuat seam
  muncul gratis
- `05-agent-ideas-catalog.md` — kriteria naik kelas (task bounded, output
  terverifikasi mekanis) yang dipenuhi strategi ini
