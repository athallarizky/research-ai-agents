# 10 — Multi-VPS & Cross-Repo: Model Operasional Repo Agent Terpisah

> Pertanyaan asal (tiga berturut-turut, 2026-08-21):
> "jika kita buat vps agent menjadi entitas repo yang terpisah, bagaimana cara
> kita combine di project portfolio?"
> "berarti repo agent-ops akan menampung seluruh log untuk semua vps saya?"
> (asumsi: lebih dari 1 VPS)
> "bagaimana kita set envnya? apakah runner di repo utamanya? ... repo portfolio
> env nya di set melalui github action?"

Konteks: sprint-1 `agent-ops` berjalan; pertanyaan muncul saat membayangkan
masa depan — banyak VPS, dan repo produk (portfolio) yang "digabung" dengan
repo agent. Tiga jawaban membentuk satu model operasional utuh: repo agent
adalah **program**, bukan gudang data dan bukan pusat kendali.

## Intuisi utama: analogi repo antivirus

Repo `agent-ops` itu seperti **repo source code aplikasi antivirus**. Tiap
mesin meng-install (clone) program itu, tetapi repo-nya tidak pernah
menerima data dari mesin siapa pun. Log pengguna tidak ada hubungannya
dengan repo aplikasinya.

Dari satu analogi ini turun tiga fakta yang sering tertukar:

1. Repo agent = kode + docs, statis, identik untuk semua host
2. Tiap host = installan + memori sendiri (`state.json`, gitignored)
3. GitHub issues = satu-satunya kotak masuk bersama — isinya laporan
   ringkas, bukan raw log

## 1. Combine dengan repo produk: via host, issues, dan file — bukan kode

Prinsip arah panah (aturan utama):

```
agent-ops ──observe──►  portfolio (sebagai target yang diawasi)
agent-ops ──report───►  GitHub issues (channel komunikasi)
portfolio ◄──read────   output agent (opsional, degrade gracefully)
```

> Portfolio tidak pernah *butuh* agent untuk jalan. Agent adalah observer,
> bukan dependency. Semua agent mati -> portfolio tetap hidup normal,
> hanya tidak ada yang melapor.

Empat pola kombinasi, dari longgar ke erat:

| Pola | Mekanisme | Biaya |
|---|---|---|
| A. Portfolio sebagai watched target | portfolio = entri config (`http[]`, `units[]`) di agent-ops; repo produk tidak berubah | nol — sudah jadi desain doctor |
| B. Routing issue via env | `GITHUB_REPO` per-run; issues jadi message bus antar repo; dibedakan per host via field `host` di schema Vitals | hampir nol |
| C. Status page | (1) portfolio JS fetch issues ber-label `server-report` — repo agent harus public; (2) agent menulis `status.json` di VPS yang di-serve portfolio — file path adalah satu-satunya kontrak; (3) API route portfolio baca `state.json` | kecil; kuncinya: seksi status error bukan situs error (`try/catch`, tampil "no data") |
| D. Exception: traffic insight | hidup **di dalam** repo portfolio — coupled ke schema konten + dashboard produk; sudah diputuskan di `05-agent-ideas-catalog.md` | by placement, bukan by integration |

Yang tidak boleh: import lintas repo, monorepo merge, shared package (rule of
three belum terpenuhi), build/runtime produk bergantung pada agent hidup,
agent menulis ke repo produk tanpa lewat PR/PAT ter-scope (converge-via-PR
tetap berlaku, lihat `04-guardrails-and-security.md`).

Satu kalimat: **combine via host, issues, dan file — bukan via kode.** VPS
adalah titik temu operasional; GitHub issues titik temu data.

## 2. Multi-VPS: tidak ada pusat, tidak ada data lake

```
VPS-A: clone agent-ops + .env + cron ──┐
                                       ├──> issues di GitHub
VPS-B: clone agent-ops + .env + cron ──┘     (boleh 1 tracker,
                                             dibedakan via field host)
```

Lokasi data yang benar:

| Tempat | Isi | Umur |
|---|---|---|
| Repo `agent-ops` | kode + docs saja | statis |
| Tiap VPS: `state.json` + metrics | memori pribadi host: verdict terakhir, baseline, hitungan flapping | lokal, gitignored, tidak pernah dikirim |
| GitHub issues | laporan anomali (ringkasan) | satu-satunya yang terkumpul |

Multi-VPS tidak menuntut perubahan arsitektur apa pun: clone + `.env` +
crontab per host, masing-masing independen. Mati satu host tidak memengaruhi
lainnya — bonus dari desain stateless per host (turunan langsung desain
watchdog di `07-cron-watchdog-design.md`).

## 3. Dua model env: pusat menyuntik vs mesin menyimpan

Pertanyaan "portfolio env di-set via GitHub Action?" membuka perbandingan
dua model yang memang berbeda — bukan salah satu yang kurang:

| | Produk dengan CI (portfolio) | Agent VPS (doctor) |
|---|---|---|
| Secret disimpan di | GitHub repo settings (Actions Secrets) | file `.env` di disk tiap VPS |
| Disuntuh oleh | runner ephemeral, per-run | `node --env-file=.env`, per cron tick |
| Dipicu oleh | push -> pusat -> deploy | cron -> lokal, tanpa pusat |
| Runner | GitHub Actions (pusat) | cron di VPS itu sendiri |

Kalau tidak ada pusat yang menyuntik, kredensial harus sudah ada di mesin —
maka `.env` di disk, dipasang manual sekali per host (clone, `npm install`,
tulis `.env`, `crontab -e`; disentuh lagi hanya saat rotasi key).

### Kenapa model pusat ditolak untuk doctor

Scheduled workflow yang tiap jam SSH ke VPS adalah alternatif yang bisa saja
berfungsi, tetapi kalah di empat hal:

1. **Kolektor butuh akses lokal** — `df`, `journalctl`, `systemctl`, `free`
   paling natural dari dalam mesin; dari luar semua harus di-tunnel SSH
2. **Permukaan serang bertambah** — SSH inbound untuk IP runner + SSH key
   sebagai secret; bertentangan dengan prinsip "agent resident, bukan
   invader" (sudah di `03-trigger-wiring.md`)
3. **Ironi watchdog** — kesehatan VPS jadi bergantung pada GitHub Actions
   up; Actions delay/down -> watchdog ikut buta
4. Self-hosted runner (Pola B) berisiko untuk repo public — dicatat di
   `03-trigger-wiring.md`

### Silence is a signal

Model tanpa pusat punya properti menarik: **VPS yang mati total tetap
terdeteksi** — tidak ada issue yang masuk adalah sinyal sendiri. Watchdog
berbasis pusat kehilangan properti ini: pusat yang down membuat semua host
diam serentak, dan diam itu ambigu.

## 4. Keputusan yang dicatat

1. Kombinasi lintas repo hanya lewat host, issues, dan file; arah dependency
   satu arah (agent mengamati produk), produk tidak pernah bergantung agent.
2. `agent-ops` tidak menampung data runtime apa pun; `state.json` per host
   lokal-gitignored; issues = inbox bersama berisi laporan ringkas.
3. Tidak ada runner pusat: **cron di tiap VPS adalah runner-nya**; `.env`
   di disk, dipasang manual sekali per host.
4. Model pusat (scheduled Actions + SSH) ditolak dengan alasan akses lokal,
   permukaan serang, dan ironi watchdog; "silence is a signal" menjadi
   properti yang dijaga.
5. Provisioning script (ansible / deploy script) baru layak di 3+ VPS;
   di bawah itu, manual dua menit per host adalah pilihan yang tepat.

## Terkait

- [`03-trigger-wiring.md`](./03-trigger-wiring.md) — tiga pola trigger;
  file ini memperjelas bahwa pola C (daemon+cron) yang dipilih, tanpa
  runner pusat, plus alasan penolakan model pusat
- [`05-agent-ideas-catalog.md`](./05-agent-ideas-catalog.md) — aturan
  penempatan repo (ops vs produk); pola D di sini adalah penerapan aturan itu
- [`07-cron-watchdog-design.md`](./07-cron-watchdog-design.md) — desain
  doctor; stateless per run adalah akar dari model multi-VPS ini
- [`09-manual-trigger-and-next-agents.md`](./09-manual-trigger-and-next-agents.md) —
  spectrum trigger manual; SSH + npm script (level 1-2) konsisten dengan
  "tidak ada pusat" di sini
- Implementasi: repo `agent-ops` (sprint-1; `.env` gitignored sejak phase 1,
  deployment multi-VPS di phase 6)
