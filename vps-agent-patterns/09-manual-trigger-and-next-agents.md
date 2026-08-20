# 09 — Manual Trigger & Kandidat Agent Berikutnya

> Pertanyaan asal: "selain doctor, ide agent apa lagi?" lalu lanjut
> "kalau agent-nya tipe manual, triggernya pakai apa?"

Konteks diskusi: sprint-1 `agent-ops` sedang berjalan (phase 2, 2026-08-21) —
`agents/doctor` sudah punya runtime LLM (`llm.ts`) dan sedang menuju
kolektor vitals. Diskusi ini melihat ke depan: antrian agent kedua dan
seterusnya, plus satu kelas trigger yang belum dibahas di
`03-trigger-wiring.md`: **dipicu manusia**.

Dua hal yang dibawa pulang dari diskusi:

1. **Katalog ide bertambah** — enam kandidat agent maintenance-server,
   diklasifikasikan menurut trigger naturalnya (cron vs manual).
2. **Manual trigger itu gratis** pada desain cron-first — dan spektrum
   mekanismenya cukup lebar, dari SSH sampai chat bot.

## 1. Kandidat agent berikutnya (setelah doctor)

Dua sudah ada di backlog sprint (`plan.md` agent-ops: auditor, digest);
empat lainnya muncul dari diskusi. Beda sudut dengan katalog di
`05-agent-ideas-catalog.md`: katalog lama berfokus otomasi **repo/konten**,
yang ini semuanya **maintenance server** — sesuai aturan penempatan
("agent yang merawat server -> repo ops").

| Agent | Kerja | Trigger natural | Catatan |
|---|---|---|---|
| `digest` | agregasi issue doctor + tren vitals lintas run jadi laporan mingguan | cron mingguan | paling murah: cuma baca state + issues yang sudah ada; LLM kuat di narasi tren |
| `auditor` | brute-force SSH di auth.log, fail2ban, port terbuka, paket pending update, config drift | cron berkala | nilai security tertinggi; bisa berbagi pola kolektor dengan doctor |
| `cert-watcher` | cek kedaluwarsa TLS cert semua domain + saran renew | cron harian | deterministic-heavy, peran LLM kecil — kandidat "script biasa + LLM opsional" |
| `backup-verifier` | pastikan backup jalan (age, size, checksum) + test-restore sesekali | cron berkala | paling "menyelamatkan hidup" kalau backup gagal diam-diam |
| `patch-advisor` | baca paket upgradable + changelog -> risk assessment sebelum `apt upgrade` manual | **manual** | konteksnya "aku mau upgrade sekarang, apa risikonya?" — tidak ada gunanya tiap jam |
| `log-triage` | bedah pola error journal mingguan (bukan sekadar deteksi ada/tidak seperti doctor) | cron + ad-hoc | versi dalam dari journal sampling doctor |

Urutan natural yang disarankan: `digest` (termurah) -> `auditor` (nilai
tertinggi) -> sisanya menunggu kebutuhan nyata. Semua bisa memakai kerangka
doctor: kolektor defensif + fingerprint dedup + LLM tanpa tools.

Anti-over-engineering tetap berlaku: agent kedua share-by-copy dari doctor;
`shared/` baru diekstrak setelah agent ketiga (rule of three, sudah jadi
keputusan arsitektur agent-ops).

## 2. Insight utama: cron-first membuat manual trigger gratis

Doctor (dan semua agent yang mengikuti polanya) didesain **stateless per
run**: tidak ada server yang listen, tidak ada state di memori — semua
persist ke `state.json`, semua output keluar lewat GitHub issue. Efek
sampingnya: "manual trigger" bukan fitur yang harus dibangun, melainkan
sudah built-in — tinggal jalankan command-nya.

Bukti di desain doctor:

- **One-shot semantics** — `await session.prompt()` resolve setelah run
  penuh -> exit bersih. Ini syarat utama cron, sekaligus syarat nyaman
  dipanggil manual.
- **Semua jalur adalah CLI dengan flags** — `--metrics-file`, `--dry-run`.
  Jalur testing dan jalur manual adalah jalur yang sama.

Kebalikannya tidak selalu benar: agent yang didesain event-driven (webhook
listener, Pola A di `03-trigger-wiring.md`) tidak selalu enak di-cron karena
butuh process yang hidup terus. Untuk personal VPS, polling cron hampir
selalu menang: tidak ada yang harus idup, tidak ada uptime yang dijaga.

Prinsip satu kalimat: **desain stateless per run memberi cron dan manual
gratis sekaligus; desain event-driven hanya memberi event.**

## 3. Spectrum mekanisme trigger manual

| # | Mekanisme | Bentuk | Cocok untuk |
|---|---|---|---|
| 1 | SSH + run | `ssh vps "node agents/patch-advisor/src/main.ts"` | default; nol infrastruktur |
| 2 | npm script / alias | `npm run patch` di VPS, atau shell alias di laptop yang nge-SSH | biar tidak hafal path panjang |
| 3 | Pi interactive | buka `pi` di terminal, tanya ad-hoc | diagnosa spontan; tidak butuh agent formal |
| 4 | Chat bot | `/patch` ke bot Telegram -> SSH exec -> hasil balik di chat | UX terbaik untuk yang sering dipakai |
| 5 | Webhook listener | HTTP endpoint kecil di VPS | jawaban untuk masalah yang belum dimiliki |

Rekomendasi progresi untuk personal VPS: **level 1-2 dulu** (gratis), level
3 sudah terpenuhi sekarang (itu memang cara kerja pi), level 4 kalau sudah
malas SSH-in, level 5 tidak dibahas sampai ada kebutuhan nyata.

Catatan penting tiap level:

- **Level 2** — trigger manual hanyalah soal *pemanggil*; agent-nya tidak
  berubah sama sekali. Paling banter tiap agent dapat satu entri npm script.
- **Level 3** — jangan dianggap remeh: sesi interaktif memenuhi 80% kasus
  "aku cuma mau tanya satu hal". Agent formal baru layak kalau prompt +
  gate + output-nya mau distandarkan.
- **Level 4** — menambah satu script penerima update -> `execFile` -> reply;
  agent tetap CLI biasa. Yang dibeli adalah UX, bukan kemampuan.
- **Level 5** — berbayar secara operasional: process manager, uptime,
  validasi signature. Sama dengan Pola A `03-trigger-wiring.md`.

## 4. Trigger tidak sama dengan tempat eksekusi

Agent seperti `patch-advisor` butuh data yang hanya ada di VPS (`apt`).
Dua bentuk yang mungkin:

- **Trigger di laptop, jalan di VPS** — `ssh vps "npm run patch"`, hasil
  tetap posting ke GitHub issue. Karena laporan memang sudah by-design
  keluar lewat GitHub, *di mana tombol ditekan jadi tidak penting*.
- **Jalan di laptop dengan kolektor remote** — kolektor melakukan SSH
  sendiri ke VPS. Lebih ribet; hanya masuk akal kalau mau UI lokal.

Ini keuntungan struktural dari pola "output lewat jalur review" (issue/PR)
yang sudah jadi keputusan di `04-guardrails-and-security.md`: channel output
yang terpusat membuat lokasi trigger dan lokasi eksekusi terpisah bebas.

## 5. Keputusan yang dicatat

1. Antrian agent berikutnya di agent-ops: `digest` -> `auditor` -> (sisanya
   menunggu kebutuhan). Backlog resmi tetap di `docs/ideas/` agent-ops
   setelah sprint-1 selesai — file ini sumber risetnya.
2. Manual trigger resmi memakai **SSH + npm script**; chat bot dievaluasi
   ulang kalau frekuensi pemakaian naik; webhook listener ditolak untuk
   sekarang (tidak ada kebutuhan event-driven).
3. Agent baru yang natural-nya manual-first (`patch-advisor`) tidak
   menuntut perubahan arsitektur apa pun — dia hanya CLI tanpa crontab.
4. Klasifikasi by-trigger layak jadi kolom tetap di katalog ide mana pun
   ke depannya: cron / manual / event — karena kolom itu langsung
   menentukan infrastruktur (crontab entry vs tidak ada vs listener).

## Terkait

- [`03-trigger-wiring.md`](./03-trigger-wiring.md) — tiga pola trigger
  (webhook / runner / daemon+cron); file ini menambah kelas keempat:
  human-triggered, dan menunjukkan mengapa cron-first mencakupnya gratis
- [`05-agent-ideas-catalog.md`](./05-agent-ideas-catalog.md) — katalog ide
  otomasi repo; kandidat di sini sudutnya maintenance server (repo ops),
  sesuai tabel penempatan di file itu
- [`07-cron-watchdog-design.md`](./07-cron-watchdog-design.md) — desain
  doctor yang jadi acuan pola stateless per run
- Implementasi: repo `agent-ops` (`agents/doctor`, sprint-1 berjalan)
