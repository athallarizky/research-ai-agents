# Huawei Wearable Agents — AI Agent di Wearable Huawei

Riset tentang **apakah dan bagaimana AI agent tools bisa dibangun di wearable
Huawei**, khususnya Watch Fit 4 Pro yang menjalankan Lite Wearable HarmonyOS.

Pertanyaan awal (penulis):

> "Saya punya Huawei wearable device (Watch Fit 4 Pro). Apakah kita bisa develop
> app pada device tersebut? Idenya saya ingin membuat atau install AI agent tools
> di device tersebut. Apakah ada batasannya?"

Jawaban singkat: **bisa develop app, tapi agent loop penuh tidak bisa hidup di
watch.** Seri Fit menjalankan Lite Wearable (RTOS ringan) tanpa akses network
langsung, jadi pola yang feasible adalah thin client: UI di watch, otak agent
di companion app HP, komunikasi via Wear Engine P2P. Detail di
`04-agent-architecture.md`.

## Cara baca

1. `01-platform-overview.md` — landscape device Huawei: Lite Wearable vs full
   HarmonyOS NEXT, dan di mana posisi Watch Fit 4 Pro
2. `02-development-path.md` — toolchain (DevEco Studio, JS/HML/CSS), jalur
   distribusi (AppGallery / sideload), dan Wear Engine SDK
3. `03-limitations.md` — batasan konkret dan implikasinya untuk AI agent
4. `04-agent-architecture.md` — arsitektur thin client yang realistis,
   precedent, dan alternatif tanpa watch app
5. `05-two-lane-bridge-design.md` — design terkunci (2026-08-18): dua lane,
   keputusan tech stack, kontrak API cw-hub, protokol safety
6. `06-system-explained-simply.md` — versi bahasa sederhana: analogi kantor,
   tiga cerita alur (approve, pengawasan, input dari jam)
7. `07-project-ideas-catalog.md` — katalog ide project (2026-08-18):
   produktivitas, gamification/belajar bahasa, AI pet, hiburan — semua
   masih level ide, belum ada yang dibawa ke tahap design

## Konsep hasil riset

Aplikasi konkret dari riset ini: **remote control Claude Code (Termux) dari
watch** — watch sebagai remote approve/monitor. Keputusan: Lane A (supervise)
sebagai MVP konsep, bridge Kotlin, watch app dumb renderer. Status: **design
only** — repo ini khusus riset & diskusi, tidak ada implementasi yang
direncanakan di sini. Detail dan decision log di
`05-two-lane-bridge-design.md`.

## Intuisi utama

Ada dua dunia wearable Huawei, dan bedanya menentukan segalanya:

| | Lite Wearable (Fit series) | Full HarmonyOS NEXT (Watch 4/5/Ultimate) |
|---|---|---|
| Sistem operasi | RTOS ringan, HarmonyOS mini | HarmonyOS NEXT penuh |
| Bahasa app | JavaScript/HML/CSS (framework mini) | ArkTS/ArkUI penuh |
| Akses network | Tidak langsung — relay via HP | Ada (via HP/Wear Engine) |
| Sideload APK | Tidak bisa (bukan Android) | Bisa (APK/sideload) |
| Ekosistem app | Nyaris kosong | Terbatas tapi hidup |

Kesimpulan kunci untuk ide AI agent: **watch bukan tempat otak agent — watch
adalah layar dan input.** Semua kemampuan agent (LLM API, tools, memory, loop)
hidup di HP; watch menerima dan menampilkan.

## Sumber utama

- Huawei Developer Forum — [Develop a simple app for Watch Fit 4](https://forums.developer.huawei.com/forumPortal/en/topic/0205201275198482079)
- Huawei Developer — [Wear Engine: Service Introduction](https://developer.huawei.com/consumer/en/doc/connectivity-Guides/service-introduction-0000000000018585)
- Huawei Developers (Medium) — [Differences Between Lite Wearable and Wearable](https://medium.com/huawei-developers/what-are-the-differences-between-lite-wearable-and-wearable-devices-cf521ae0602e)
- GitHub — [Home-Assistant-HarmonyOS-Next](https://github.com/gentslava/Home-Assistant-HarmonyOS-Next) (precedent arsitektur thin client)

Daftar lengkap per topik ada di masing-masing file.

## Terkait

- [`../pi-agent-core/14-loop-mechanics-and-positioning.md`](../pi-agent-core/14-loop-mechanics-and-positioning.md) —
  referensi agent loop: loop yang akan hidup di sisi HP, bukan di watch
- [`../ai-terminology-map/01-taxonomy-framework.md`](../ai-terminology-map/01-taxonomy-framework.md) —
  kerangka memilah istilah (arsitektur vs pattern vs artifak) yang dipakai
  di catatan ini
