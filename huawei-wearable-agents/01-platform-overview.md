# Platform Overview — Dua Dunia Wearable Huawei

## Posisi Watch Fit 4 Pro

Watch Fit 4 Pro menjalankan **Lite Wearable** — varian HarmonyOS ringan di atas
RTOS, bukan HarmonyOS NEXT penuh. Ini bukan detail teknis kosong: hampir semua
batasan pengembangan (lihat `03-limitations.md`) turun langsung dari fakta ini.

Huawei membagi wearable-nya dalam dua kelas:

| Kelas | Contoh device | Sistem | Model app |
|---|---|---|---|
| Lite Wearable | Watch Fit series, sebagian GT lama | RTOS + HarmonyOS mini | JS/HML/CSS, framework mini |
| Wearable penuh | Watch 4/5/Ultimate | HarmonyOS NEXT | ArkTS/ArkUI penuh |

Sumber perbedaan kedua kelas:
[What Are The Differences Between Lite Wearable and Wearable Devices](https://medium.com/huawei-developers/what-are-the-differences-between-lite-wearable-and-wearable-devices-cf521ae0602e)
(Huawei Developers, Medium).

## Konsekuensi kelas Lite Wearable

1. **Bukan Android, bukan juga HarmonyOS NEXT.** Tidak ada APK, tidak ada
   ArkTS penuh. App dibangun dengan JavaScript + HML (markup) + CSS di atas
   framework mini khusus Lite Wearable.
2. **Runtime minimal.** Device kelas ini punya RAM/storage kecil dan baterai
  prioritas — framework app-nya sengaja dibatasi (tidak ada DOM penuh,
   API surface kecil).
3. **Ekosistem tipis.** AppGallery untuk seri Fit nyaris kosong; komunitas
   pengguna mencatat kesulitan menemukan app sama sekali. Sisi positif:
   ruang kosong untuk app pertama yang berguna.

## Model runtime app: mini-program, bukan web

Sintaks JS/HML/CSS menipu — **ini bukan browser dan bukan web app.** Yang ada
adalah framework mini milik firmware dengan sintaks web-like sebagai DSL:

| Lapisan | Web app biasa | Lite Wearable |
|---|---|---|
| Markup | HTML | HML — komponen terbatas (`div`, `text`, `list`, `image`) |
| Styling | CSS | subset CSS-like |
| Logic | JS di V8/SpiderMonkey | JS di engine mini embedded (kelas JerryScript/QuickJS) |
| Rendering | browser engine penuh | UI toolkit native kecil milik firmware |
| API | DOM, fetch, dll | modul `@system.*` — surface kecil |

Mental model: **model mini-program** (seperti WeChat mini-program / Zepp OS),
dan strukturnya lebih dekat ke Vue (objek `data` reaktif) daripada React.

### Kenapa React Native tidak mungkin di sisi watch

React Native bukan bahasa, melainkan aplikasi berisi runtime yang menumpang OS
host. Syaratnya gagal semua di Lite Wearable:

- butuh sistem UI native sebagai target render (Android View / UIKit) — tidak
  ada Android di sini, dan UI toolkit firmware tidak bisa diakses pihak ketiga
- runtime RN harus terpasang di device — firmware hanya meng-interpret format
  framework miliknya
- toolchain RN tidak bisa menghasilkan HAP Lite Wearable

Preseden menunjukkan ini norma industri wearable ringan: Garmin pakai Monkey C,
Zepp OS pakai JS mini-program, watch face Tizen lama pakai web tech. Device
kelas ini hampir selalu punya runtime app mini proprietary.

### Implikasi desain

Watch app murni dumb renderer (snapshot + preset actions) — dan framework mini
yang hanya bisa render + event persis cukup untuk itu. Detail arsitektur di
`05-two-lane-bridge-design.md`. Catatan: batasan ini tidak berlaku di sisi HP —
bridge app bebas pilih stack (keputusan: Kotlin, lihat `05`).

## Analogi

Lite Wearable : HarmonyOS NEXT ≈ **smartwatch feature-phone : smartphone**.
Keduanya "punya app", tapi yang satu menjalankan widget-ringan, yang lain
aplikasi sungguhan. Kalau dibandingkan dengan dunia yang lebih dikenal:

- Lite Wearable app ≈ mini-app/watchface di miBand/galaxy Fit — JS ringan,
  UI deklaratif sederhana
- HarmonyOS NEXT watch app ≈ Wear OS app — app "asli" dengan SDK besar

## Pertanyaan yang belum terverifikasi

- Versi API persis yang didukung firmware Watch Fit 4 Pro saat ini
  (indikasi dari forum: device Lite Wearable umumnya tertahan di
  API 6 / SDK 4.0.0 — lihat `03-limitations.md`).
- Apakah semua kemampuan Wear Engine (message, file, notification reply)
  tersedia untuk Fit 4 Pro, atau subset saja. Cek daftar device resmi:
  [Wear Engine Service Introduction](https://developer.huawei.com/consumer/en/doc/connectivity-Guides/service-introduction-0000000000018585).

## Sumber

- [Develop a simple app for Watch Fit 4 (Huawei Forum)](https://forums.developer.huawei.com/forumPortal/en/topic/0205201275198482079)
- [Getting Started with HarmonyOS Wearable App Development](https://developer.huawei.com/consumer/en/multidevice/wearables/get-started/)
- [What Are The Differences Between Lite Wearable and Wearable Devices](https://medium.com/huawei-developers/what-are-the-differences-between-lite-wearable-and-wearable-devices-cf521ae0602e)
