# Agent Architecture — Pola Thin Client

## Arsitektur yang direkomendasikan

```
+---------------------+       Wear Engine        +----------------------+       HTTP
|  Watch Fit 4 Pro    |         P2P              |  Companion app       |        HTTPS
|                     <------------------------> |  (Android)           <------------------> +-----------+
|  - chat UI ringan   |   message: perintah      |                      |                     | LLM API   |
|    (JS/HML/CSS)     |   message: respons       |  - agent loop        |                     | (cloud /  |
|  - preset quick     |   file: konteks/audio    |  - tool execution    |                     |  lokal)   |
|    actions/tombol   |                          |  - memory/session    |                     +-----------+
|  - render markdown  |                          |  - auth & API keys   |
|    sederhana        |                          |  - koneksi Huawei    |
+---------------------+                          |    Health (wajib)    |
                                                 +----------------------+
```

Pembagian kerja:

| Lapisan | Di mana | Kenapa |
|---|---|---|
| Presentation + input | Watch | Layar & tombol ada di sana; beban komputasi nol |
| Agent loop (LLM call, tool use) | HP companion app | Butuh network, memory, eksekusi tools |
| Model / API | Cloud atau server lokal | Watch tidak bisa, HP bisa |

Pola ini identik dengan yang dibuktikan jalan oleh
[Home-Assistant-HarmonyOS-Next](https://github.com/gentslava/Home-Assistant-HarmonyOS-Next)
(untuk Watch 4/5; pola komunikasinya sama via Wear Engine, lihat juga contoh
[Lite Wearable ↔ mobile](https://github.com/Explore-In-HMOS-Wearable/sportwatch-wear-engine-lite-wearable-to-mobile)).

## Komponen sisi HP (companion app)

1. **Agent core** — loop LLM standar (system prompt → tool calls → respons).
   Bisa implementasi sendiri atau framework agent di Android/Kotlin atau
   cross-platform.
2. **Wear Engine binding** — register P2P receiver, kirim respons ke watch,
   handle reconnect (Bluetooth putus-nyambung harus idempotent).
3. **Session/memory** — riwayat chat bisa disimpan portabel memakai format
   [`../session-interchange-format/SPEC.md`](../session-interchange-format/SPEC.md),
   sehingga sesi agent di watch bisa dilanjutkan dari HP/desktop.
4. **Health Kit (opsional)** — kalau agent ingin konteks sensor (detak jantung,
   tidur, langkah): aksesnya dari sisi HP lewat Health Kit SDK, bukan dari
   watch app.

## Komponen sisi watch (Lite Wearable app)

- Satu-dua page: daftar percakapan ringkas + tampilan respons
- Quick actions (preset perintah) — mengetik di jam hampir mustahil
- Struktur pesan sederhana (JSON kecil via P2P), render teks + format ringan
- Hindari markdown penuh — render subset (bold, list, code inline)

## Alternatif tanpa watch app sama sekali

Kalau mau validasi ide dulu sebelum masuk toolchain Huawei:

1. **Agent di HP + notifikasi ke watch.** Huawei Health meneruskan notifikasi
   HP ke watch; agent HP mengirim ringkasan/status via notifikasi, interaksi
   balasan terbatas (quick reply) — zero watch development.
2. **Widget/complication** (kalau didukung firmware) — menampilkan status
   agent di watchface.

Kedua jalur ini bukan "agent di watch", tapi cara termurah menguji nilai
produk sebelum berinvestasi di Lite Wearable app.

## Open questions (belum diriset)

- Apakah notification reply / quick reply dari watch bisa memicu intent ke
  app pihak ketiga di HP?
- Kualitas dan latensi voice input: apakah mic watch bisa streaming audio ke
  HP via Wear Engine file transfer untuk STT di HP?
- Proses review AppGallery untuk watch app: syarat, waktu, kebijakan konten
  AI/LLM.
- Batas ukuran pesan/file P2P per call (mempengaruhi desain chunking respons).

## Prinsip yang bisa ditarik

> Mendesain agent untuk device lemah = mendesain **protokol sinkron** antara
> UI tipis dan otak jauh. Kompleksitasnya pindah dari "bagaimana jalankan
> model" ke "bagaimana format & sinkronkan percakapan lintas dua device
> dengan koneksi Bluetooth yang tidak andal".

Beririsan dengan [`../session-interchange-format/`](../session-interchange-format/) —
format session portabel jauh lebih berharga saat agent-nya sendiri pindah-pindah
device (watch ↔ HP ↔ desktop).
