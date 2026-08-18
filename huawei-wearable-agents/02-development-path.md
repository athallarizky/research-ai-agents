# Development Path — Toolchain dan Distribusi

## Toolchain

| Komponen | Keterangan |
|---|---|
| IDE | DevEco Studio (Windows/macOS) |
| Template project | "Lite Wearable" app model |
| Bahasa | JavaScript + HML (markup) + CSS |
| Akun | Huawei Developer account (gratis, perlu verifikasi) |
| Debug | Via koneksi Bluetooth melalui Huawei Health app + DevEco debugging assistant |

Tutorial resmi step-by-step:
[Getting Started with HarmonyOS Wearable App Development](https://developer.huawei.com/consumer/en/multidevice/wearables/get-started/)
dan panduan komunitas
[Lite Wearable Application Development Using DevEco Studio](https://medium.com/huawei-developers/huawei-lite-wearable-application-development-using-deveco-studio-hamonyos-6c65346dab78).
Untuk setup debug/signing di device nyata:
[Running & Debugging HarmonyOS Apps on Huawei Watches](https://dev.to/harmonyos/running-debugging-harmonyos-apps-on-huawei-watches-a-complete-setup-guide-for-developers-4903).

Catatan penting: DevEco Studio terbaru ditujukan untuk API HarmonyOS NEXT
yang lebih baru. Untuk target Lite Wearable, pastikan pakai SDK/compiler yang
cocok dengan API version device (lihat `03-limitations.md` soal API ceiling).

## Distribusi

Dua jalur:

1. **AppGallery (publik).** User install watch app lewat Huawei Health app
   di HP: Devices → AppGallery. Ini satu-satunya jalur distribusi resmi ke
   pengguna lain; butuh akun developer + review Huawei.
2. **Sideload (development/testing).** Lewat DevEco debugging assistant yang
   terhubung ke watch via Huawei Health. Jalur ini rawan error instalasi
   (lihat "Error 40" di `03-limitations.md`).

## Wear Engine — jembatan HP ↔ watch

[Wear Engine](https://developer.huawei.com/consumer/en/doc/connectivity-Guides/service-introduction-0000000000018585)
adalah SDK sisi HP (Android) untuk berkomunikasi dengan watch:

- **P2P messaging** — kirim/terima pesan antara companion app dan watch app.
  [Dokumentasi Send Message](https://developer.huawei.com/consumer/en/doc/connectivity-Guides/send-message-0000001052460491).
- **File transfer** — kirim file ke/dari watch.
- **Notification & data** — interaksi notifikasi, sensor/health data.

Syarat sisi HP:

- HP Huawei (EMUI 4.1+ / HarmonyOS 2.0+), atau
- HP Android lain (6.0–14.0) **dengan Huawei Health app terinstall**.

Contoh kode yang bisa dipelajari:

- [wear-engine-hmos-next-wearable-to-phone](https://github.com/Explore-In-HMOS-Wearable/wear-engine-hmos-next-wearable-to-phone)
  — messaging phone ↔ wearable (target NEXT)
- [sportwatch-wear-engine-lite-wearable-to-mobile](https://github.com/Explore-In-HMOS-Wearable/sportwatch-wear-engine-lite-wearable-to-mobile)
  — P2P antara Android dan **Lite Wearable** sport watch; paling relevan
  untuk pola serupa di seri Fit

## Struktur minimal proyek

```
my-fit-app/
├── entry/                  ← app module
│   ├── src/main/js/        ← logic (JavaScript)
│   ├── src/main/css/       ← styling
│   └── src/main/pages/     ← halaman: .hml + .js + .css per page
├── resources/              ← string, media, config device
└── metadata.json           ← manifest app
```

(Susunan persisnya mengikuti template DevEco Studio versi yang dipakai;
treat sebagai sketsa, bukan contract.)
