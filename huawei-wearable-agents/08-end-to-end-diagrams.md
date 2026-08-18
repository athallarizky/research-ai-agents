# Diagram Teknis End-to-End

Status: **visualisasi dari design yang sudah terkunci** (2026-08-19).
Kedua diagram dibuat dengan skill
[diagram-design](https://github.com/cathrynlavery/diagram-design) (skin
editorial default), merender langsung di browser tanpa build step.

1. [`diagrams/e2e-architecture.html`](diagrams/e2e-architecture.html) —
   arsitektur end-to-end
2. [`diagrams/approval-sequence-a2.html`](diagrams/approval-sequence-a2.html) —
   sequence alur approval mekanisme A2

## Diagram 1 — Arsitektur end-to-end

Empat komponen, kiri ke kanan:

| Komponen | Ranah | Peran |
|---|---|---|
| Watch App | Watch Fit 4 Pro (Lite Wearable JS) | dumb renderer — 4 screen, maks 2 tap |
| Bridge App | Android (Kotlin, foreground service) | kurir: Wear Engine P2P + HTTP client (OkHttp) |
| cw-hub | Termux (Node stdlib, zero-dep) | **kontrak inti** — satu-satunya jalur ke tmux |
| Claude Code | Termux (TUI di dalam tmux) | sesi kerja + hooks |

Prinsip yang digambar: *watch render, bridge relay, Termux bekerja.*
Termux tidak tahu ada watch; watch tidak tahu ada Termux.

Konektor yang ditampilkan:

- **P2P · PUSH / P2P · ACTION** — dua arah Wear Engine antara bridge dan
  watch (pesan ≤1 KB per Amendemen 1)
- **GET /STATE** — long-poll bridge → cw-hub (`?wait=30`); balas segera
  saat ada event
- **SCREEN · KEYS** — `GET /screen` (capture fresh) dan `POST /keys`
  (hanya untuk teks bebas setelah verifikasi)
- **POST /NOTIFY** — hooks Claude Code → cw-hub via curl

Anotasi runtime (teks italic): tiga proses wajib hidup bersama — Termux,
bridge, Huawei Health — layar HP boleh mati total.

## Diagram 2 — Sequence approval (mekanisme A2)

Alur waktu untuk satu approval menggunakan PermissionRequest hook
(pengganti injeksi keystroke A1, lihat `05` Amendemen 1):

1. Bridge menjaga long-poll `GET /state` ke cw-hub
2. Tool butuh permission → hook PermissionRequest fire **sebelum** prompt
   tampil; `POST /notify` ke cw-hub **menahan** sampai keputusan ada
   (inilah yang menggantikan capture-verify-send)
3. cw-hub menjawab long-poll bridge dengan event approval
4. Bridge push approval card ke watch via P2P; user tap
5. Fragment `alt`:
   - **[USER TAP APPROVE]** — action → cw-hub → JSON `{allow}` kembali ke
     hook (panah coral = headline), tool dieksekusi
   - **[DENY · TIMEOUT]** — JSON `{deny}`; tanpa respons, prompt TUI
     muncul lagi seperti biasa

## Catatan kejujuran visual (fidelity)

- Label `POST {ALLOW}` / `POST {DENY}` pada diagram sequence adalah nama
  ilustratif: kontrak cw-hub di `05` belum mendefinisikan endpoint
  keputusan A2 (open question — perilaku timeout hook juga belum
  diriset).
- `GET /state?wait=30` disingkat `GET /STATE` agar lolos budget label
  skill (≤14 karakter).
- Diagram tidak menggambar Lane B (ditunda), Huawei Health (hanya lift
  Bluetooth), dan mekanisme pairing token — ketiganya ada di `05`.

## Regenerasi

Skill terpasang di `~/.claude/skills/diagram-design/`. Verifikasi otomatis:
`python3 ~/.claude/skills/diagram-design/scripts/self_check.py <file>`
(sudah lolos untuk kedua file saat dibuat).
