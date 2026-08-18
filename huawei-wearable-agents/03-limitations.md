# Limitations — Batasan dan Implikasinya untuk AI Agent

## Empat batasan utama

### 1. Tidak ada akses network langsung dari watch

App di watch **tidak bisa** memanggil HTTP/API apa pun. Semua koneksi keluar
harus lewat companion app di HP via Wear Engine P2P. Precedent yang menegaskan
ini: [Home-Assistant-HarmonyOS-Next](https://github.com/gentslava/Home-Assistant-HarmonyOS-Next)
— client Home Assistant untuk Huawei Watch yang arsitekturnya dipaksa
"watch = UI, HP = network" karena watch tidak punya jalur network sendiri.

Implikasi agent: LLM API call, tool execution, memory retrieval — semua
terjadi di HP (atau cloud). Watch murni presentation + input.

### 2. API ceiling — versi SDK tertutup

Laporan forum: device Lite Wearable dengan firmware HarmonyOS 4.0.0.120 hanya
mendukung **hingga API 6 (SDK 4.0.0)**, sementara DevEco Studio terbaru
(5.x/6.x) target API yang lebih tinggi. Hasilnya gap kompatibilitas — gejala
umumnya [Error 40 saat install HAP](https://forums.developer.huawei.com/forumPortal/en/topic/0201202047517553128)
via DevEco assistant.

Implikasi agent: toolchain harus dipin ke versi SDK lama; fitur API baru
(HarmonyOS NEXT) tidak tersedia. Anggap API surface beku.

### 3. Runtime terbatas

Framework JS mini: tidak ada DOM penuh, tidak ada low-level Bluetooth,
API sensor dan sistem kecil, resource CPU/RAM hemat. Audio/video playback
saja jadi topik tanya-tanya di forum (mainkan MP3 lokal saja bermasalah).

Implikasi agent: tidak ada speech-to-text lokal, tidak ada model on-device,
tidak ada agent loop berat. Bahkan streaming render teks panjang perlu
didesain hati-hati (layar kecil, memori kecil).

### 4. Ekosistem nyaris kosong

AppGallery untuk seri Fit sangat sedikit isinya. Sisi gelap: sedikit
referensi, komunitas kecil, banyak trial-error sendiri. Sisi terang:
nyaris tidak ada kompetisi, dan device-nya ada di tangan banyak orang.

### 5. Tidak ada keypad untuk app pihak ketiga (temuan 2026-08-18)

Framework Lite Wearable tidak memiliki komponen input teks — IME Kit (dan
keyboard sistem) hanya tersedia di HarmonyOS penuh. Satu-satunya jalur teks
bebas dari watch adalah **notification reply**: system (via Huawei Health)
menyediakan UI balasan miliknya — quick reply preset, emoji, keyboard/voice
tergantung device — dan teksnya kembali ke app Android melalui mekanisme
RemoteInput standar. Berlaku hanya untuk pairing Android.

Implikasi desain: preset prompt hidup di watch app; teks bebas menumpang
kanal notifikasi. Detail di `05-two-lane-bridge-design.md`.

## Ringkasan: apa yang tidak mungkin vs apa yang tetap bisa

| Tidak mungkin (di watch) | Tetap bisa |
|---|---|
| Panggil LLM/API langsung | UI chat/reply di watch |
| Agent loop on-device | Loop, tools, memory di companion app HP |
| STT/TTS lokal | Render respons teks agent |
| LLM on-device / model kecil | Kirim perintah singkat (tap/preset/voice via HP) |
| Sideload APK | Distribusi via AppGallery (review Huawei) |
| Keypad/input teks bebas di app | Teks bebas via notification reply (RemoteInput) |

## Prinsip yang bisa ditarik

Batasan ini bukan spesifik Huawei — pola umum wearable kelas ringan
(mirosandan dengan Wear OS Go / RTOS watch pada umumnya):

> **Agent di wearable = agent di HP + remote control di pergelangan tangan.**

Mendesain "AI agent di watch" secara efektif berarti mendesain pembagian
kerja: apa yang harus tampil di layar 1.7 inci, apa yang dikerjakan
di belakang di HP.

## Sumber

- [Error 40 installing Lite Wearable HAP (Huawei Forum)](https://forums.developer.huawei.com/forumPortal/en/topic/0201202047517553128)
- [Wear Engine Service Introduction](https://developer.huawei.com/consumer/en/doc/connectivity-Guides/service-introduction-0000000000018585)
- [Home-Assistant-HarmonyOS-Next](https://github.com/gentslava/Home-Assistant-HarmonyOS-Next)
- [Develop a simple app for Watch Fit 4 (Huawei Forum)](https://forums.developer.huawei.com/forumPortal/en/topic/0205201275198482079)
