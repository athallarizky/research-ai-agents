# Agent Checkpoint — Handoff Lintas Device

Status: **checkpoint per 2026-08-19**, ditulis agar agent di device lain
bisa melanjutkan riset ini tanpa membaca ulang seluruh riwayat. Kalau
checkpoint ini kedaluwarsa (git log lebih baru dari commit yang
disebut), percayai repo, bukan dokumen ini.

## Baca dulu (urutan untuk agent baru)

1. [`../../AGENTS.md`](../../AGENTS.md) — aturan repo: **riset &
   diskusi saja, dilarang implementasi kode**
2. [`README.md`](README.md) — peta topik, daftar dokumen 01–09
3. [`05-two-lane-bridge-design.md`](05-two-lane-bridge-design.md) —
   design terkunci + decision log + open questions (dokumen paling
   penting)
4. [`08-end-to-end-diagrams.md`](08-end-to-end-diagrams.md) — visual
   end-to-end (buka HTML di `diagrams/`)

## Pertanyaan riset yang dijawab topik ini

Bisakah AI agent tools hidup di Huawei Watch Fit 4 Pro? Jawaban singkat:
**agent loop tidak bisa hidup di watch** — seri Fit menjalankan Lite
Wearable (RTOS ringan, tanpa akses network langsung). Pola yang feasible:
thin client — watch sebagai layar/input, otak di HP/Termux, komunikasi
via Wear Engine P2P.

## Konsep konkret & status

Aplikasi riset: **Watch Fit 4 Pro sebagai remote approve/monitor untuk
Claude Code yang berjalan di Termux (HP yang sama)**.

| Aspek | Keputusan (locked di `05`) |
|---|---|
| MVP | Lane A (supervise/approve); Lane B (quick prompt) ditunda |
| Bridge app | Kotlin + Wear Engine + foreground service; HTTP *client* |
| Watch app | Lite Wearable JS/HML/CSS; dumb renderer |
| Sisi Termux | cw-hub — server HTTP Node stdlib zero-dep, `127.0.0.1:8742` |
| Approval | Mekanisme A2 (PermissionRequest hook gate), bukan injeksi keystroke A1 |
| Distribusi | Sideload pribadi (adb + DevEco), tanpa AppGallery |

**Status keseluruhan: design only.** Tidak ada baris kode implementasi —
dan memang tidak boleh ada di repo ini.

## Riwayat sesi (ringkas)

| Tanggal | Yang terjadi |
|---|---|
| 2026-08-18 | Riset platform + batasan; design terkunci (docs 01–06) |
| 2026-08-18 | Brainstorming ide project → katalog ide `07` (12 ide, 5 kelompok) |
| 2026-08-19 | Diagram teknis end-to-end dengan skill diagram-design → `08` + `diagrams/` |
| 2026-08-19 | Checkpoint ini ditulis |

Checkpoint ditulis saat HEAD = `b88ecab`
(docs: add end-to-end technical diagrams).

## Open questions aktif (arah riset lanjutan)

1. Perilaku timeout PermissionRequest hook — apa yang terjadi pada sesi
   saat hook melebihi timeout tanpa jawaban
2. Keandalan long-poll localhost di belakang doze mode (mitigasi:
   wakelock + foreground service)
3. Keyboard/voice pada notification reply di Fit 4 Pro — per device
4. Kontrak endpoint keputusan A2 di cw-hub belum didefinisikan
   (`POST {ALLOW}` / `POST {DENY}` di diagram sequence adalah nama
   ilustratif)
5. Akses data Huawei Health dari companion app (prasyarat ide B4/D2 di
   katalog `07`)

## Reminder untuk agent

- Semua kelanjutan adalah **riset, diskusi, atau dokumentasi** — bukan
  implementasi. Jangan menyarankan "mulai coding" sebagai next step.
- Perubahan desain baru masuk lewat amendemen di `05`, bukan menimpa
  keputusan lama (pola: decision log bertambah).
- Diagram baru: pakai skill diagram-design (konvensi di `08`),
  simpan di `diagrams/`, self-check sebelum commit.
