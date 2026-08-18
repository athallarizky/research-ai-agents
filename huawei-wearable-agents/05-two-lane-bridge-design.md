# Two-Lane Bridge Design — Remote Claude Code dari Watch

Status: **design locked 2026-08-18**. Implementasi belum dimulai.

Konsep konkret dari riset topik ini: Watch Fit 4 Pro sebagai remote control
untuk sesi Claude Code yang berjalan di Termux pada HP yang sama.

## Decision log

| Tanggal | Keputusan |
|---|---|
| 2026-08-18 | MVP = **Lane A** (supervise/approve). Lane B (headless quick prompt) ditunda |
| 2026-08-18 | Bridge app: **Kotlin** + Wear Engine + foreground service; HTTP *client*, bukan server |
| 2026-08-18 | Watch app: framework Lite Wearable (JS/HML/CSS) — satu-satunya opsi; peran murni dumb renderer |
| 2026-08-18 | Sisi Termux: **cw-hub** — server HTTP Node stdlib, zero-dep; akses tmux tetap di Termux |

Alasan pemilihan Kotlin untuk bridge: app-nya setipis relay (foreground service
+ P2P + satu HTTP client), Wear Engine adalah SDK Android native sehingga
aksesnya langsung tanpa binding layer, dan permukaan UI-nya nyaris nol.

## Koreksi arsitektur (temuan saat locking design)

Sketsa awal menggambar bridge menjalankan `tmux capture-pane` / `send-keys`
langsung. **Itu mustahil** — app Android dan Termux adalah proses terpisah;
tidak ada jalur eksekusi perintah antar keduanya.

Konsekuensi desainnya: Termux harus menyediakan server (dia satu-satunya yang
bisa menyentuh tmux), dan bridge turun kelas menjadi client localhost.

## Arsitektur final

```
[Watch app]                [Bridge app]                          [Termux]
Lite Wearable JS           Kotlin, foreground service
dumb renderer              + Wear Engine SDK (P2P)
                           + OkHttp (client saja)
     ←—— P2P ——→           │
  approve/deny             │ long-poll localhost:8742
  status, screen tail      ▼
                           [cw-hub: node, zero-dep]
                             ├─ POST /notify   ←—— hooks Claude Code (curl)
                             ├─ GET  /state    ←—— long-poll bridge (event push)
                             ├─ GET  /screen   ——→ tmux capture-pane (fresh)
                             └─ POST /keys     ——→ tmux send-keys (setelah verify)
```

Prinsip: **watch render, bridge relay, Termux bekerja.** Termux tidak tahu ada
watch; watch tidak tahu ada Termux; semua coupling lewat kontrak di bawah.

## Dua lane

| | Lane A — Supervise (MVP) | Lane B — Quick prompt (ditunda) |
|---|---|---|
| Target | sesi TUI Claude Code yang terbuka | `claude -p --resume` (headless) |
| Dari watch | approve/deny, lihat tail output | preset prompt ringan |
| Mekanisme | `tmux send-keys` + verifikasi | proses baru, output stdout |
| Risiko | keystroke nyantarapuh terhadap perubahan TUI | headless menolak tool berpermission |
| Status | MVP | pasca-MVP |

Lane A dipilih sebagai MVP karena use case utamanya mengawasi pekerjaan
long-running dari jam. Konsekuensi: siklus capture-verify-send (bawah) menjadi
critical path MVP.

## State model — truth di tmux, watch render snapshot

| Hook Claude Code | State watch | Payload |
|---|---|---|
| `SessionStart` | `IDLE` | session id, cwd |
| `UserPromptSubmit` | `WORKING` | prompt singkat |
| `Notification` | `NEEDS_INPUT` | alasan: permission / idle |
| `Stop` | `IDLE` | ringkasan (tail terfilter) |
| `SessionEnd` | `STOPPED` | — |

Output tail bersifat **pull** (watch minta, cw-hub capture fresh); push hanya
untuk event bernilai tinggi: approval dan selesai.

## Kontrak API cw-hub (localhost:8742)

| Endpoint | Arah | Fungsi |
|---|---|---|
| `POST /notify` | hook → cw-hub | event baru (dipakai long-poll /state) |
| `GET /state?wait=30` | bridge → cw-hub | long-poll; balas segera saat ada event |
| `GET /screen?lines=20` | bridge → cw-hub | capture-pane fresh |
| `POST /keys` | bridge → cw-hub | send-keys (hanya jika verifikasi lolos) |

Binding `127.0.0.1` saja. Token bearer opsional (pairing sekali: token
ditampilkan bridge, ditempel ke config cw-hub) — risiko yang diterima tanpa
token: app lain di HP yang sama bisa memanggil localhost:8742.

## Protokol P2P watch ↔ bridge

Phone → watch: `status_update {state, summary}`, `approval_request {id, tool,
command}`, `output_tail {lines[]}`
Watch → phone: `action {request_id, type: approve|deny}`, `fetch_screen`,
`hello {last_seq}` (reconnect + replay antrean terlewat)

Approval request membawa snapshot teks area prompt untuk verifikasi.

## Safety — capture-verify-send (critical path Lane A)

Masalah stale approval: jawab di HP, lalu tap approve di watch → `y` nyasar
masuk ke layar yang sudah berubah. Protokol wajib:

1. Setiap approval punya `request_id` + snapshot teks prompt
2. Sebelum `POST /keys`: bridge `GET /screen`, cocokkan marker prompt
3. Tidak cocok → drop action, kirim `status_update` ke watch
4. Semua action idempotent by design
5. Sequencing: replay antrean saat reconnect berbasis `last_seq`

## Privacy — summary-first

Default: summary mode (state + baris terakhir yang sudah difilter). Raw tail
opt-in per sesi. Filter mengadaptasi konsep
[`../session-interchange-format/REDACTION.md`](../session-interchange-format/REDACTION.md)
+ pola `redact-scan.mjs`.

## UI watch — 4 screen, maksimal 2 tap

1. **Home** — state icon, elapsed, satu baris aktivitas, 2 tombol
2. **Approval card** — tool + cuplikan command (scroll), Approve / Deny
3. **Output tail** — N baris monospace, refresh
4. **Quick prompts** — preset list (didefinisikan di Termux)

## Distribusi (pakai pribadi)

- Bridge: sideload APK ke HP sendiri (adb), tanpa AppGallery
- Watch app: sideload via DevEco debugging assistant (lihat
  `02-development-path.md`)
- Catatan: Wear Engine mengidentifikasi peer berdasar package name — watch app
  dan bridge app kemungkinan wajib satu bundle name (verifikasi saat implementasi;
  precedent: Home-Assistant-HarmonyOS-Next)

## Amendmen 1 (2026-08-18): temuan riset lanjutan

### Batas ukuran pesan P2P — terkonfirmasi resmi

Maksimum **1 KB per pesan** ([dokumentasi Send Message](https://developer.huawei.com/consumer/en/doc/connectivity-Guides/send-message-0000001052460491));
lebih dari itu di-chunk atau lewat file. File transfer: 100 MB phone ke watch,
4 MB watch ke phone. Konsekuensi: `output_tail` default sekitar 10 baris per
pesan; lebih dari itu multi-message dengan sequence number.

### Bundle name pairing — terkonfirmasi

[FAQ resmi Wear Engine](https://developer.huawei.com/consumer/en/doc/connectivity-guides/faq-0000001050818031):
package name, app ID, dan certificate fingerprint watch app harus match dengan
phone app. Watch app dan bridge adalah satu identitas aplikasi tunggal.

### Mekanisme approval bergeser: A1 → A2

Riset dokumentasi Claude Code menemukan mekanisme resmi yang menggantikan
injeksi keystroke untuk approval:

| | A1: keystroke injection | A2: PermissionRequest hook gate |
|---|---|---|
| Status | tidak resmi; opsi & angka tak didokumentasikan | resmi; decision JSON `allow`/`deny` + always allow |
| Cara kerja | prompt tampil di TUI → `send-keys` | hook menahan SEBELUM prompt → tunggu watch → balas JSON |
| Kelemahan | rapuh antar versi; keystroke nyasar | blocking + timeout; tanpa respons → prompt muncul lagi |

A2 menghapus kebutuhan capture-verify-send untuk approval (tidak ada lagi
keystroke yang bisa nyasar ke dialog). Satu-satunya key yang resmi
didokumentasikan untuk dialog permission TUI adalah `Esc` (dismiss). A1 tetap relevan untuk **input teks
bebas ke composer TUI** (teks masuk ke baris input idle — jauh lebih aman
daripada menjawab dialog). Sumber: [hooks#permissionrequest](https://code.claude.com/docs/en/hooks#permissionrequest).

Catatan hook lain: Notification hook `permission_prompt` baru fire setelah
prompt idle ~6 detik — untuk push instan ke watch, pakai PermissionRequest.

## Syarat hidup runtime (temuan 2026-08-18)

Termux **tidak perlu terbuka di foreground** — tetapi prosesnya wajib hidup
di background, karena claude, tmux, dan cw-hub semuanya proses Termux.
Rantai penuhnya butuh **tiga proses hidup bersama**, semuanya di background,
layar boleh mati total:

| Proses | Perannya | Syarat tetap hidup |
|---|---|---|
| Termux | ruang kerja (claude+tmux+cw-hub) | wakelock, bebas battery-opt, tidak di-swipe, start ulang pasca-reboot |
| Bridge app | kurir + P2P | foreground service (notifikasi persisten) |
| Huawei Health | lift Bluetooth | sudah hidup terus by design sebagai companion watch |

Kondisi mati yang harus diingat: swipe-away Termux dari recent apps dan
reboot HP mematikan seluruh rantai. tmux melindungi dari tutup-buka jendela
terminal, bukan dari matinya proses Termux.

## Open questions

- Batas ukuran pesan P2P: **resolved** (1 KB, lihat Amendmen 1)
- Bundle name pairing: **resolved** (wajib match, lihat Amendmen 1)
- Mapping keystroke approval: **resolved** — digantikan mekanisme A2
  (PermissionRequest hook); keystroke hanya untuk teks bebas
- Kecepatan/keandalan long-poll localhost di belakang doze mode (mitigasi:
  `termux-wake-lock` + foreground service)
- Perilaku timeout PermissionRequest hook: apa yang terjadi pada session
  saat hook melebihi timeout tanpa jawaban (riset)
- Ketersediaan keyboard/voice pada notification reply di Fit 4 Pro
  (vs hanya quick reply preset) — verifikasi per-device
