# Resumable Real-Time LLM Streaming — Named Rendezvous via Redis Streams

Riset tentang arsitektur **streaming LLM / AI agent real-time yang bersifat resumable**
(dapat disambung kembali saat koneksi terputus tanpa kehilangan event dan tanpa
mengulang eksekusi).

Catatan ini mendokumentasikan pola desain dan temuan dari studi kasus Glance
Engineering (Aditya Singh, September 2026), membedah mengapa pendekatan konvensional
(gRPC stream, Kafka) gagal memenuhi kebutuhan, dan bagaimana Redis Streams menjadi
solusi *named rendezvous* yang decoupling gateway dari siklus hidup agent.

## Masalah: Agent Loop Berdurasi Panjang di Jaringan Nyata

Saat AI agent mengerjakan instruksi yang kompleks, satu putaran (*turn*) tidak lagi
berupa respons instan. Agent membutuhkan waktu puluhan detik hingga menit untuk:
reasoning -> load skill -> panggil tool 1 -> tunggu hasil -> panggil tool 2 ->
sintesis jawaban akhir.

Di lingkungan produksi nyata:
- Koneksi klien (terutama mobile/seluler) sering terputus di tengah jalan.
- Pod gateway mengalami restart atau rolling deploy.
- Tool tertentu mendelegasikan tugas ke pipeline asinkron eksternal yang baru selesai
  beberapa menit kemudian.

Menjaga satu koneksi HTTP/SSE tetap terbuka sepanjang proses ini sangat rapuh.

### Empat Batasan Desain

1. **Server-side streaming:** Mengalirkan event progres secara kontinu (tool yang dipilih,
   hasil eksekusi tool, progres perantara, blok jawaban akhir). Klien harus melihat
   aktivitas berkala.
2. **Resumption per-turn:** Jika koneksi klien putus di tengah turn, klien dapat reconnect
   dan melanjutkan persis dari posisi event terakhir tanpa mengulang inferensi dan tanpa
   kehilangan event.
3. **No topology coupling:** Gateway tidak boleh terikat dengan pod agent mana yang
   menjalankan turn. Gateway pod mana pun harus bisa melayani klien mana pun.
4. **Survival across deploys:** Rollout atau restart pod tidak boleh membunuh turn yang
   sedang in-flight. Event tidak boleh hanya hidup di memori proses yang fana.

Inti kebutuhan ini bukan sekadar transpor streaming, melainkan **addressability**
(kemampuan pengalamatan) di level turn:
> *"Berikan saya event untuk turn X mulai dari posisi N ke depan."*

---

## Silsilah Iterasi: Mengapa Pendekatan Umum Gagal

```
Iterasi 1: Client ---[SSE]---> Agent Service (Bloated & tight coupling)
Iterasi 2: Client ---> Gateway ---[gRPC Stream]---> Agent (Pipe tanpa memori)
Alternatif: Client ---> Gateway <---[Kafka]---> Agent (Partisi != Turn)
Iterasi 3: Client ---> Gateway <---[Redis Stream (turn_id)]---> Agent Pods / Workers
```

### Iterasi 1: Klien Terhubung Langsung ke Agent Service via SSE

Arsitektur awal paling sederhana: klien membuka koneksi SSE langsung ke service agent.

**Penyebab gagal:**
Semua urusan non-inferensi menumpuk di dalam agent service: autentikasi, rate limiting,
riwayat sesi, analitik, dan *response shaping* (penerjemahan format event ke kebutuhan
berbagai surface, misalnya Smart TV vs HP). Saat kontrak UI klien berubah, tim harus
mengubah dan men-deploy ulang agent service.

**Solusi pemisahan:**
Sistem dipecah menjadi dua:
- **Agent Service:** Memiliki LLM loop, skills, tools, memory, dan persistence.
- **Gateway:** Memiliki auth, rate limits, history, analitik, dan translasi format UI.

### Iterasi 2: gRPC Streaming Antara Gateway dan Agent Service

Memisahkan kedua service dan menghubungkannya dengan gRPC streaming tampak ideal:
protokol binary, latensi rendah, framing efisien, dan tanpa perantara (*no intermediary*).

**Penyebab gagal:**
> *"gRPC stream adalah pipa, padahal yang dibutuhkan adalah buffer."*

Pipa tidak memiliki memori. Event hanya ada saat melintasi koneksi tersebut:
- Jika koneksi gateway-agent putus atau pod di-restart, jalur pengiriman dan pemulihan
  lenyap seketika. Agent loop mungkin masih berjalan, tetapi gateway tidak bisa meminta
  kembali data yang terlewat.
- Menambahkan penyimpanan replay terpisah di samping gRPC menciptakan sistem *dual-path*
  (data dikirim via gRPC sekaligus ditulis ke DB). Ini memicu masalah sinkronisasi,
  deduplikasi, dan *source of truth*. Jika storage replay sudah ada dan bisa dialamati
  per-turn, lebih baik membaca dari storage tersebut sejak awal.
- gRPC stream terikat pada koneksi spesifik satu pod agent (*pod-affinity*). Gateway harus
  mengetahui pod mana yang menjalankan turn tertentu, merusak batasan *no topology coupling*.

### Eksplorasi Alternatif: Mengapa Bukan Apache Kafka?

Kafka menyediakan durabilitas dan replay log, tetapi tidak cocok untuk kasus ini karena:
> **Pada partitioned log, unit pengalamatannya adalah partisi.**
> **Sedangkan unit pemulihan yang dibutuhkan adalah turn.**

Offset Kafka melekat pada partisi. Membuat satu partisi per turn tidak realistis karena
turn dibuat ribuan kali secara dinamis dan berumur pendek (hitungan detik/menit).
Jika banyak turn dicampur ke dalam partisi yang sama, proses resume memerlukan:
*seek ke offset tertentu, lalu scan maju sambil memfilter turn_id*. Ini mengharuskan
rekayasa indexing tambahan di atas Kafka.

---

## Solusi: Named Rendezvous via Redis Streams

Arsitektur yang berhasil membuang asumsi bahwa agent harus streaming langsung ke gateway.
**Agent tidak streaming ke gateway sama sekali; agent menulis ke Redis Stream bernama
`turn_id`, dan gateway membaca dari nama kunci tersebut.**

```
+--------+       1. Request (turn_id)       +---------------+
| Client | -------------------------------> |    Gateway    |
|        | <------------------------------- | (Returns 202) |
+--------+       SSE Connection Open        +-------+-------+
    |                                               |
    |                                      XREAD BLOCK (turn_id)
    |                                               |
    |                                               v
    |                                    +--------------------+
    |                                    |    Redis Stream    |
    |                                    |   Key: {turn_id}   |
    |                                    +--------------------+
    |                                               ^
    |                                               |
    |                                         XADD (events)
    |                                               |
    |                                    +----------+---------+
    +--- Receive events via SSE <------- |   Agent Loop /     |
         (with unified Redis ID)         | Background Worker  |
                                         +--------------------+
```

### Mekanisme Eksekusi

1. **Reader (Gateway) mencetak `turn_id`:**
   Gateway membuat UUID `turn_id` sebelum memanggil agent service, lalu memanggil agent
   secara asinkron dan menerima status **202 Accepted**. Gateway langsung memblokir
   bacaan (`XREAD BLOCK`) pada key Redis tersebut. Jika writer yang membuat ID, akan
   terjadi race condition antara event pertama yang ditulis dan reader yang baru mencari key.
2. **Kursor Tunggal Terpadu:**
   Redis Stream secara alami memberikan ID berurutan berbasis timestamp (contoh:
   `1755600000123-0`). ID ini diteruskan utuh sebagai event ID pada protokol SSE:
   ```http
   id: 1755600000123-0
   data: {"type":"tool_selected","tool":"search"}
   ```
   Saat koneksi putus, browser/klien otomatis mengirim kembali header:
   ```http
   GET /sessions/{sid}/turns/{tid}/stream
   Last-Event-ID: 1755600000123-0
   ```
   Tiga lapisan (Redis, SSE, Klien) menyepakati satu format kursor yang sama tanpa
   konversi.
3. **Recovery Didorong oleh Klien (Client-Driven):**
   Kursor lokal gateway diabaikan saat koneksi putus. Titik mulai replay ditentukan
   murni oleh `Last-Event-ID` yang diakui klien.
   > *"Duplicates are recoverable. A silent gap is not."*
4. **Siklus Hidup & TTL Otomatis:**
   Redis Stream tidak memiliki sinyal close bawaan. Kunci harus memiliki masa kedaluwarsa:
   - Saat event pertama ditulis (`XADD`), TTL konservatif (misal 15-30 menit) disetel
     secara atomik untuk mencegah kebocoran memori jika pod mati tertabrak `SIGKILL`.
   - Saat turn selesai secara normal, TTL dipersingkat menjadi jendela reconnect
     (misal 2-5 menit). Setelah itu Redis menghapusnya secara otomatis.

---

## Kasus Penentu: Turn yang Tertunda (Suspended Turn)

Pola ini terbukti unggul saat menghadapi proses asinkron yang memakan waktu lama:
1. Agent memanggil tool pihak ketiga yang membutuhkan waktu beberapa menit.
2. Agent menulis event progres *"started"* ke Redis Stream, menandai status turn
   sebagai *awaiting_async*, lalu **proses agent langsung keluar (exit) dan mati**.
3. Di sisi gateway dan klien, koneksi tetap menunggu dengan sabar.
4. Dua menit kemudian, pipeline eksternal selesai. Hasilnya diambil oleh pod worker
   baru yang sama sekali berbeda dan tidak memiliki memori dari proses awal.
5. Worker baru cukup melakukan `XADD` ke kunci `{turn_id}` yang sama dan mengirimkan
   terminal event.

Sistem ini bekerja karena titik temu (*rendezvous*) berbentuk **Nama Kunci**, bukan
**Koneksi Jaringan**. Proses baru tidak bisa menulis ke soket yang sudah mati dua menit
lalu, tetapi sangat mudah menulis ke nama kunci Redis yang sama.

---

## Model Streaming: Typed UI Blocks vs Token Deltas

Keputusan format data yang dialirkan ke klien:
- **Bukan token-by-token delta:** Tim Glance tidak mengalirkan potongan kata per kata
  ke klien. Fragmentasi token memaksa klien melakukan buffering dan rekonstruksi objek.
- **Typed UI Blocks utuh:** Satu blok UI (misal: kartu produk, carousel, daftar opsi,
  atau ringkasan teks) dialirkan sekaligus sebagai satu event utuh setelah blok tersebut
  selesai digenerate oleh model.
- **Event di sekeliling jawaban:** Mengalirkan event progres yang informatif: tool apa
  yang sedang dipilih, hasil eksekusi tool, dan status tahapan agent loop.

---

## Biaya, Batasan, dan Trade-off Lapangan

| Aspek | Realitas Lapangan & Mitigasi |
|---|---|
| **System of Record** | Redis Stream adalah transpor sementara, bukan database permanen. Riwayat percakapan tetap wajib ditulis ke database utama secara terpisah. |
| **Overhead Latensi** | Lompatan ekstra melalui Redis menambah overhead sekitar 10-20 ms (p99 spike ke 40-60 ms). Angka ini dapat diabaikan untuk tugas agent yang memakan waktu puluhan detik. |
| **Granularitas Timeout** | Pengecekan timeout dilakukan setiap kali loop `XREAD BLOCK` selesai (misal per 30 detik). Timeout hening 60 detik bisa baru terpicu di detik ke 60-90. |
| **Komputasi vs Event** | Log Redis menyelamatkan urutan event yang sudah terbit, bukan komputasi aktif di CPU/GPU. Jika pod agent crash saat LLM sedang berpikir, komputasi itu hilang kecuali menerapkan checkpointing memori agent. |
| **Kanal Pembatalan Balik** | Writer tidak tahu jika klien pergi selamanya. Agent loop akan tetap menyelesaikan pekerjaannya hingga batas timeout turn tercapai (trade-off yang diterima secara sadar). |

---

## Aksioma & Intuisi Desain

1. **Unit Pemulihan Menentukan Pilihan Transpor:**
   > *"Pick your transport around the unit you need to recover, not the unit you happen to execute in."*
   Eksekusi berjalan di dalam proses/pod, tetapi pemulihan berjalan di level turn.
   Maka turn yang harus memiliki nama dan alamat independen.
2. **Buffer Mengalahkan Pipa untuk Operasi Non-Instan:**
   Pipa streaming (gRPC, TCP socket murni) mengasumsikan kedua ujung selalu sehat.
   Segala pekerjaan yang membutuhkan waktu lebih dari beberapa detik membutuhkan buffer
   ber-alamat.
3. **Decoupling Sejati adalah Berbagi Nama, Bukan Berbagi State:**
   Gateway dan Agent tidak berbagi memory, pod affinity, atau direct socket.
   Keduanya hanya menyepakati satu string: `turn_id`.

---

## Terkait

- [`../loop-engineering/README.md`](../loop-engineering/README.md) — Empat properti loop
  yang di-engineer (terminasi, biaya, kualitas sinyal, konvergensi); pola Redis Streams
  menjadi mekanisme penyampaian sinyal loop ke dunia luar.
- [`../vps-agent-patterns/README.md`](../vps-agent-patterns/README.md) — Menjalankan agent
  di server, integrasi webhook/async worker, dan batasan eksekusi mandiri.
- [`../ai-terminology-map/02-engineering-stack.md`](../ai-terminology-map/02-engineering-stack.md) —
  Posisi arsitektur streaming ini berada pada irisan *harness engineering* (runtime
  infrastruktur) dan *loop engineering*.

## Sumber

- Aditya Singh — *Building Resumable Real-Time LLM Streaming with Redis Streams*
  (Glance Engineering, 3 September 2026).
- Redis Documentation — *Redis Streams Tutorial & XREAD Specification*.
