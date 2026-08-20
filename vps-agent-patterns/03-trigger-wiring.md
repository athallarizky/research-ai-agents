# 03 — Trigger Wiring: Tiga Pola Meminggil Agent di Server

> Pertanyaan asal: "bisa di trigger via workflow atau apapun, dan agentnya
> berjalan di vps"

Masalahnya dua sisi: **dari mana** agent dipanggil (trigger), dan **di mana**
agent dieksekusi (server). Tiga pola mapping yang umum:

| Pola | Cara kerja | Cocok untuk |
|---|---|---|
| **A. Webhook receiver** | service kecil di server (Fastify/Express) menerima GitHub webhook / `repository_dispatch`, validasi HMAC, lalu spawn agent sebagai proses sekali-jalan | event-driven: push, PR, issue berlabel |
| **B. Self-hosted runner** | server menjalankan GitHub Actions runner sendiri; workflow YAML dieksekusi langsung di server dengan akses lokal | ingin tetap mendefinisikan segalanya di YAML; repo harus private atau runner terisolasi |
| **C. Daemon + poll/cron** | agent long-lived (SDK) atau skrip terjadwal yang bangun berkala, mengecek GitHub API / log / metrik | tugas terjadwal: audit berkala, digest, monitoring |

## Pola A — Webhook receiver (event-driven)

```
GitHub ──(push/issue/PR event)──> receiver di VPS
                                    │  validasi HMAC + filter event
                                    v
                                  spawn agent (CLI headless / SDK)
                                    │  cwd: clone repo, instruksi: skill X
                                    v
                                  output: PR / issue / REST call
```

Detail yang menentukan:

- **Validasi signature wajib.** Payload webhook diverifikasi terhadap
  `X-Hub-Signature-256` (HMAC-SHA256 dengan secret di env server). Tanpa
  ini, siapa pun yang bisa mengirim HTTP request bisa menyuruh agent jalan.
- **Filter event sebelum spawn.** Receiver menolak event yang tidak
  dikenalnya — putih di atas hitam, bukan hitam di atas putih.
- **Spawn per job, bukan proses abadi.** Satu event = satu proses agent
  dengan umur terbatas. Gagal satu job tidak menular; tidak ada state
  nyangkut antar job.
- **Trigger resmi dari sisi GitHub**: webhook repo, atau workflow yang
  mengirim `repository_dispatch` / `workflow_dispatch` ke endpoint.

## Pola B — Self-hosted runner

Workflow GitHub Actions biasa, tapi job-nya mendarat di runner yang berjalan
di server sendiri — sehingga langkah-langkahnya punya akses filesystem,
service, dan jaringan lokal.

Caveat keamanan yang disorot GitHub sendiri di dokumentasinya: **self-hosted
runner pada repo public sangat berisiko** — fork PR bisa menjalankan kode
arbitrary di mesin itu kalau tidak dikonstrain. Pola ini hanya masuk akal
untuk repo private, atau dengan isolasi keras (container ephemeral, label
runner khusus, tidak pernah menerima job dari fork).

Untuk kasus repo public dengan kebutuhan sederhana (panggil agent), Pola A
memberikan kontrol yang sama dengan permukaan serang yang jauh lebih kecil.

## Pola C — Daemon / cron (terjadwal)

```
┌─ server ──────────────────────────────────────┐
│  cron/systemd timer                           │
│     │ (tiap 15 mnt / tiap Jumat / dll)        │
│     v                                         │
│  agent job: cek sesuatu -> laporan / issue    │
└───────────────────────────────────────────────┘
```

Tidak ada inbound connection sama sekali — paling aman dari tiga pola.
Kebutuhannya hanya jadwal dan akses keluar (GitHub API, endpoint publik
milik sendiri). Trade-off-nya: tidak reaktif terhadap event, hanya terhadap
waktu.

Varian long-lived: satu proses daemon dengan SDK yang mempertahankan sesi
dan bangun sesuai jadwal internal. Lebih fleksibel (state antar-run, backoff),
tapi berarti satu proses panjangumur yang harus dijaga — untuk kebutuhan
terjadwal sederhana, cron + spawn-per-job lebih membosankan tapi lebih kokoh.

## Konsep kunci: agent resident, bukan agent invader

Pola ketiganya berbagi satu properti penting: **agent berada di dalam
server, bukan masuk dari luar.**

Konsekuensinya:

- Agent bisa membaca state lokal — log, SQLite, uptime, disk — tanpa SSH
  dibuka ke luar dan tanpa kredensial tersebar.
- Tidak ada jalur "agent eksternal menembus ke production"; yang ada jalur
  sempit yang sengaja dibangun (webhook tervalidasi, atau tidak ada inbound
  sama sekali).
- Permission bisa di-scope per job: read-only untuk audit, `git push` hanya
  ke branch, dst.

Ini membalik pola lama "beri agent akses SSH ke server" menjadi "agent
adalah proses server dengan kapabilitas terbatas" — perbedaan posisi yang
sederhana tetapi mengubah seluruh model ancamannya.

## Hubungan dengan loop engineering

Ketiga pola ini adalah implementasi dari primitif loop engineering pertama —
**automations (trigger)** — dan Pola A/C memakai primitif isolasi dalam bentuk
paling sederhana (proses sekali-jalan, terpisah per job). Daftar lengkap lima
primitif dan posisinya di stack:
[`../ai-terminology-map/02-engineering-stack.md`](../ai-terminology-map/02-engineering-stack.md).

Pilihan trigger juga menentukan stop condition yang wajar: job webhook
berhenti saat task event itu selesai; job cron berhenti saat audit satu
periode selesai. Keduanya bounded by design — bukan loop terbuka.
