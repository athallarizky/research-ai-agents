# System Explained Simply — Satu Kalimat, Tiga Cerita

Versi bahasa sederhana dari desain di `05-two-lane-bridge-design.md`.
Prinsip: otak di Termux, otot di HP, wajah di jam — semua omong-omong lewat
satu kurir.

## Analogi kantor

```
HP (kantor)
├── Termux     = ruang kerja khusus, Linux kecil
│   ├── tmux   = meja kerja yang tidak pernah dibersihkan
│   │            (terminal tetap hidup walau layar ditutup)
│   ├── claude = pekerjanya (otak AI, duduk di meja tmux)
│   └── cw-hub = resepsionis di pintu ruangan (web server kecil)
│
├── Bridge app = kurir antar-lantai (app Android biasa, Kotlin)
└── Huawei Health = lift khusus ke jam tangan (Bluetooth)

Watch = TV interaktif kecil di lantai atas. Cuma layar + tombol.
        Tidak ada otak. Tidak ada internet sendiri.
```

Aturan main:

1. Jam tidak boleh bicara langsung ke Termux — tidak ada jalurnya. Semua
   pesan lewat kurir, dan kurir naik lewat lift Huawei Health.
2. Kurir tidak boleh masuk ruang Termux — app Android dan Termux adalah
   proses terpisah. Kurir titip pesan ke resepsionis via `localhost:8742`.
3. Resepsionis satu-satunya yang boleh menyentuh meja tmux: melihat layar
   (`capture-pane`) atau mengetik (`send-keys`).

## Cerita 1 — Claude minta izin (fitur utama)

Claude mau menjalankan perintah → sebelum dialog muncul, hook PermissionRequest
berbunyi → hook bisik ke resepsionis → kurir yang sedang long-poll terbangun →
naik lift → jam bergetar: kartu Approve/Deny → Anda tap → keputusan lari
balik ke hook → hook menjawab resmi `allow`/`deny`. Dialog tidak pernah
muncul di HP. Kalau tidak di-tap tepat waktu: hook timeout, dialog muncul
normal di HP — gagal dengan anggun, tidak pernah macet.

## Cerita 2 — Pengawasan

Buka layar output di jam → resepsionis fotokopi ~10 baris terakhir layar
tmux (10, bukan 20 — pesan ke jam maksimal 1 KB, kira-kira satu tweet) →
tampil di jam. Lebih panjang = beberapa pesan bernomor urut.

## Cerita 3 — Bicara dari jam

- Preset ("lanjutkan", "rangkum"): tombol di jam → lurus ke keyboard tmux
- Teks bebas: jam app tidak punya keyboard (Huawei tidak menyediakan) —
  kurir kirim notifikasi ber-kotak-balasan, system Huawei memunculkan
  keyboard-nya sendiri, teks naik lewat lift, kurir ketik ke meja tmux.
  Menumpang keyboard sistem, bukan punya sendiri.

## Identitas kembar

Watch app dan bridge app wajib satu package name + satu sertifikat — Huawei
menolak kalau tidak kembar identik. Satu app dengan dua wajah, bukan dua app.

## Terkait

- `05-two-lane-bridge-design.md` — versi teknis lengkap + decision log
- `03-limitations.md` — dari mana semua batasan ini berasal
