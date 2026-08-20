# 04 — Guardrail: Menjaga Agent yang Hidup di Server

Agent di server adalah kode yang bisa menjalankan kode lain atas nama kita.
Desain guardrail-nya lebih menentukan daripada pilihan framework.

## Prinsip umum: tiga lapisan

```
1. Orchestrator tipis    trigger/spawner tidak punya kecerdasan —
                         sesederhana mungkin, mudah diaudit
2. Agent terbatas        satu job, satu working directory, satu skill,
                         daftar tools eksplisit
3. Output terkurasi      hasil kerja agent lewat jalur review (PR/issue),
                         bukan mutasi langsung ke production
```

## Permission scoping

Kebutuhan minimum yang harus disediakan runtime (atau dijaga sendiri):

| Mekanisme | Fungsi |
|---|---|
| Working directory terbatas | agent hanya melihat clone/direktori job-nya |
| Tool allowlist | mis. `Read`, `Write`, `Edit`, `Bash(git:*)` — bash tidak bebas |
| Permission mode | bedakan "boleh edit file" vs "boleh perintah apa pun" |
| Timeout + budget | job dibunuh saat melebihi batas waktu/token |

Runtime SDK agent umumnya menyediakan semuanya; kalau loop dibuat sendiri
dari API raw, keempatnya menjadi tanggungan sendiri — ini biaya tersembunyi
pendekatan DIY (lihat `02-framework-landscape.md`).

## Converge-via-PR: output sebagai usulan, bukan mutasi

Untuk agent yang menulis (konten, kode, perbaikan):

- Output default-nya **pull request / issue**, bukan push ke branch utama,
  dan bukan tulis langsung ke sistem produksi.
- Jalur tulis langsung ke produksi (kalau memang ada) cukup satu, sempit,
  dan terdefinisi — bukan "agent punya kredensial tulis penuh".
- Reviewer tetap manusia pada tahap akhir; agent memperpendek jarak dari
  niat ke usulan jadi, bukan menggantikan persetujuan.

Analogi organisasi: agent adalah staf yang selalu mengirim draft dulu —
bukan staf yang pegang kunci ruang server.

## Bounded run dan stop condition

Dari `01-agent-concept.md`: bagian tersulit dari loop tanpa supervisi adalah
definisi "selesai". Praktiknya untuk agent di server:

- **Satu trigger = satu task terdefinisi.** "Polish draft ini menjadi PR",
  bukan "jaga repo ini tetap sehat" (tugas tak berujung).
- **Verifikasi akhir mekanis** kalau bisa: ada file output, ada nomor PR,
  ada return code. "Done" yang bisa dicek mesin, bukan perasaan model.
- **Budget keras** sebagai jaring pengaman terakhir: batas token dan waktu
  per job — kalau stop condition bagus gagal, budget yang menghentikan.

## Secrets dan identitas

- Kredensial (API key model, token GitHub, dsb.) hidup di **environment
  server**, tidak pernah di repo. Scan diff sebelum commit/push tetap
  jadi ritual standar.
- Token yang dipakai agent di-scope serendah mungkin: token yang hanya bisa
  membuka PR, bukan token admin repo; kredensial read-only untuk pekerjaan
  baca.
- Identitas agent sebaiknya distinguishable (GitHub account/bot terpisah
  atau trailer yang jelas) supaya audit bisa memilah "manusia vs agent".

## Biaya: token itu meteran

CLI/SDK headless di server = billing per token. Konsekuensi desainnya:

- Job harus bounded (di atas) — bukan loop eksploratif terbuka.
- Tugas murah-dan-deterministik sebaiknya tetap kode biasa (workflow);
  agent hanya untuk bagian yang memang butuh fleksibilitas. Lihat kembali
  rule of thumb di `02-framework-landscape.md`.
- Monitor pemakaian per job seperti memonitor biaya cron lain: kalau satu
  job tiba-tiba mahal, itu gejala stop condition yang bocor.

## Eksposur operasi server sebagai tools sempit (pola MCP)

Kebalikan dari pola ini juga layak dicatat: daripada memberi sesi agent
eksternal akses shell ke server, operasi server bisa **diekspos sebagai
tools sempit** — semacam `logs.read`, `service.status`, `deploy.trigger` —
lewat protokol seperti MCP. Perbedaannya dengan SSH:

| | SSH/shell bebas | Tools sempit (MCP-style) |
|---|---|---|
| Permukaan aksi | semua yang shell bisa | operasi yang didefinisikan |
| Audit | log shell panjang & noisy | daftar panggilan tool terstruktur |
| Revocation | rotasi kunci, aturan firewall | matikan satu tool |

Cocok kalau suatu saat agent interaktif (mis. sesi coding lokal) perlu
mengoperasikan server produksi tanpa membuka shell penuh. Model
"narrow, auditable surface" ini sejenis dengan webhook tervalidasi HMAC di
`03-trigger-wiring.md`: sama-sama mengganti pintu besar dengan pintu kecil
yang disengaja.

## Ringkasan audit sebelum agent dipercaya

Checklist sebelum sebuah agent server naik kelas (dari read-only ke
menulis, dari cron ke webhook):

1. Apakah task-nya bounded dengan verifikasi akhir mekanis?
2. Apakah tool allowlist dan working directory sudah seminimal mungkin?
3. Apakah output-nya lewat jalur review (PR/issue)?
4. Apakah kredensialnya scoped dan tidak menyentuh repo?
5. Apakah identitasnya bisa dibedakan dari manusia saat audit?
6. Kalau stop condition gagal, apakah budget menghentikannya?
