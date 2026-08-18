# Katalog Ide Project — Watch sebagai Antarmuka AI

Status: **kumpulan ide hasil diskusi (2026-08-18)**, belum ada yang dipilih
untuk didesain lanjut. Semua ide mengikuti kesimpulan arsitektur riset ini:
watch adalah layar dan input, otak AI hidup di HP/Termux (lihat
`04-agent-architecture.md` dan `05-two-lane-bridge-design.md`).

Kriteria umum yang membuat ide ini feasible di Watch Fit 4 Pro:

- UI berbasis tap (pilihan ganda / tombol), bukan keyboard
- Konten berupa payload kecil (JSON) yang dikirim via bridge cw-hub
- Semua kecerdasan (generate soal, dialog, analisis) di sisi HP/Termux

## Kelompok A — Melanjutkan watch-agent (infrastruktur sama dengan Lane A)

### A1. Lane B — quick voice prompt

Dikte singkat dari watch → dikirim ke sesi Claude headless → jawaban ringkas
tampil di layar watch. Sudah tertulis di `05-two-lane-bridge-design.md`
sebagai lane yang ditunda; ide ini adalah kandidat aktivasi berikutnya
setelah MVP Lane A jalan.

### A2. Agent heartbeat & digest

Watch menerima notifikasi berkala: agent selesai, butuh review, atau error.
Bonus: ringkasan pagi berisi hasil kerja agent semalam (daily digest).
Perluasan alami dari Lane A yang sudah di-lock.

## Kelompok B — Produktivitas

### B1. Notification triage AI

Claude memfilter dan meringkas notifikasi HP; hanya yang penting diteruskan
ke watch. Use case: fokus/deep work — watch jadi "pintu masuk satu suara".

### B2. Micro-learning flashcards

Kartu belajar hasil generate Claude, dikonsumsi 30 detik di wrist.
Berpeluang digabung dengan ide C1 (quiz).

### B3. On-call pager AI

Saat error di server, Claude meringkas insidennya, dan watch menjadi tombol
approve runbook perbaikan. Versi serius dari pola Lane A (approve) dengan
sumber event berbeda.

### B4. Health insight

Ekspor data heart rate / tidur dari Huawei Health → Claude menganalisis
tren → hasil ringkas tampil di watch. Catatan: perlu riset terpisah soal
akses data Health dari sisi HP (belum diverifikasi).

## Kelompok C — Gamification & belajar bahasa

### C1. Daily quiz deck (spaced repetition)

Tiap pagi Claude membuat 5 soal pilihan ganda dari kosakata yang sering
gagal; streak counter di watch. Model interaksi paling cocok dengan
keterbatasan input watch (tap-only). Terinspirasi Anki + Duolingo streak.

### C2. Word-of-the-day + micro-story

Satu kata baru per hari + cerita 3 kalimat yang memakai kata itu,
ditutup quiz kecil. Varian ringan dari C1.

### C3. Quiz dari materi pribadi

Claude membuat soal dari catatan/repo sendiri (mis. "apa output kode
ini?"). Belajar sambil commute, materinya personal.

## Kelompok D — AI pet / companion

### D1. Tamagotchi AI

Pet hidup di watch, "makan" dari XP yang didapat dari mencapai target
belajar/habit. Claude menyusun kepribadian pet — dialognya di-generate,
bukan script. State kecil, mudah di-sync via bridge.

### D2. Pet reaktif health data

Pet bereaksi terhadap aktivitas: "senang" saat target step tercapai,
mengomentari tidur/HR hari ini (data Huawei Health). Gabungan D1 + B4.

## Kelompok E — Hiburan

### E1. Micro choose-your-own-adventure

Claude menarasikan 2 kalimat + 2 pilihan aksi; satu cerita selesai dalam
sepekan. Kecanduan tapi ringan — satu sesi baca cuma beberapa detik.

## Kombinasi favorit (hasil diskusi)

**C1 + D1: quiz bahasa yang memberi makan pet.** Streak belajar memberi
emotional hook dari pet — dua mekanisme retention sekaligus, dan keduanya
cuma butuh deck JSON kecil + beberapa state di bridge.

## Open questions (jika salah satu ide dibawa ke tahap design)

1. Bagaimana siklus hidup konten harian (quiz deck, cerita) — di-generate
   on-demand saat watch meminta, atau pre-generated oleh scheduler?
2. Untuk ide D (pet): di mana state pet disimpan — cw-hub, watch, atau HP?
3. Untuk ide B4/D2: apakah data Huawei Health bisa diakses dari companion
   app? (belum diriset)
4. Mana ide yang jadi kandidat riset lanjutan setelah design Lane A?
