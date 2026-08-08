# 08 — Kenapa DB Query di Dalam Tool?

## Pertanyaan kunci

> "Pada contoh Express get stock, kamu query ke DB di dalam sana, kenapa? Apakah agar result dari DB responsenya akan langsung diolah ke LLM? Jadi user akan langsung mendapatkan respon kalimat LLM, bukan SQL response?"

**Ya, betul.** Yang dikembalikan ke user adalah kalimat LLM, bukan JSON mentah.

## Tanpa agent (API tradisional)

```
User: "Stok beras 5kg masih ada?"
       ↓
[Express handler]
       ↓
db.query → returns {qty: 50}
       ↓
res.json({qty: 50})  ← JSON mentah ke client
       ↓
Frontend format: "Stok: 50 unit"  ← hardcoded di client
```

**Masalah:**
- Frontend harus tau cara format tiap response
- Nggak bisa reasoning ("kalau stok < request, sarankan alternatif")
- Nggak bisa combine info dari multiple source
- User harus pakai bahasa query spesifik

## Dengan agent (Pi pattern)

```
User: "Stok beras 5kg masih ada? Saya mau beli 30"
       ↓
[LLM reasoning] "User butuh tau stok + apakah cukup untuk 30"
       ↓
[Agent panggil tool] check_stock("BERAS-5KG")
       ↓
[Tool query DB] returns {qty: 12}
       ↓
[Tool return ke agent] content: "Stok BERAS-5KG: 12 unit"
       ↓
[LLM reasoning gabungkan]
   - User minta 30
   - Stok cuma 12
   - 12 < 30 → kurang
       ↓
[LLM balas user] "Maaf, stok beras 5kg cuma 12 unit, tidak cukup
                  untuk 30 yang Anda minta. Mau saya cek produk
                  beras ukuran lain?"
       ↓
[Express kirim ke client sebagai text stream]
```

Yang terjadi ke user: **kalimat natural**, bukan `{qty: 12}`.

## Kenapa ini powerful

| Skenario | Tanpa agent | Dengan agent (DB di tool) |
|---|---|---|
| User nanya stok | Return JSON, frontend format | Langsung dapat kalimat + saran |
| Stok kurang dari permintaan | Frontend harus tau rule | Agent reasoning + sarankan alternatif |
| User nanya hal kompleks ("bisa gak saya beli 5 item beda, total 200rb?") | Multiple API call + frontend logic | Agent panggil 5 tool, gabungkan, jawab |
| Bahasa/formalitas beda | Hardcoded | Agent adaptif ("formal" untuk B2B, "santai" untuk retail) |
| Perlu explanation/justification | Nggak bisa | Agent explain "kenapa" dan "bagaimana" |
| Intent ambigu | Frontend harus parse | Agent clarify ke user dulu |

## Detail teknis: `content` vs `details`

Tool return ada 2 bagian penting:

```typescript
return {
  content: [{ type: "text", text: "Stok: 12 unit" }],  // ← LLM baca ini
  details: { sku: "BERAS-5KG", qty: 12, threshold: 20 },  // ← app baca ini
};
```

- **`content`** → dikembalikan ke LLM untuk dipakai reasoning
- **`details`** → metadata untuk aplikasi (bisa dipakai frontend via event stream untuk display UI element khusus: chart, badge "low stock", dsb.)

Jadi kamu bisa dapet **dua-duanya**: LLM reasoning dalam bentuk teks + structured data untuk UI kaya.

## Kapan JANGAN taruh DB di tool

- **Read-only simple CRUD** yang user tidak butuh reasoning → cukup REST API biasa
- **Bulk list/index** → frontend table lebih cocok daripada agent ngomongin 1000 row
- **Real-time dashboard** → websocket + chart, bukan agent

**Aturan:** pakai agent saat user butuh **interpretasi/reasoning/saran/decision**. Pakai API tradisional saat user butuh **data display mentah**. Mix keduanya adalah yang terbaik.

## Twist: bagaimana kalau user mau JSON?

Kadang user (terutama developer) mau response structured. Tetap bisa:

```
System prompt: "Jika user minta JSON, balas dengan format JSON"

User: "Kasih stok beras dalam format JSON"
LLM: {"sku":"BERAS-5KG","qty":12,"status":"low_stock"}
```

Agent bisa format sesuai permintaan. **Fleksibilitas ini yang tidak bisa REST API lakukan.**

## Pola hybrid (paling realistis)

Sebagian besar aplikasi butuh **dua-duanya**:

```
┌─ HALAMAN: PRODUCT DETAIL (Product ID: BERAS-5KG) ────────────┐
│                                                              │
│  ┌────────────────────────────────────┐                      │
│  │ Stock history chart (chart.js)     │  ◀── REST:           │
│  │                                    │      GET /products/  │
│  │      ▂▃▅▆▇▆▅▃▂▁                    │      BERAS-5KG/      │
│  │      last 30 days                  │      stock-history   │
│  └────────────────────────────────────┘                      │
│                                                              │
│  ┌────────────────────────────────────┐                      │
│  │ Sales table                        │  ◀── REST:           │
│  │ ┌────┬──────┬────────┬─────────┐   │      GET /products/  │
│  │ │Date│Qty   │Revenue │Channel  │   │      BERAS-5KG/sales │
│  │ ├────┼──────┼────────┼─────────┤   │                      │
│  │ │8/6 │50    │500.000 │Offline  │   │                      │
│  │ │8/5 │42    │420.000 │Online   │   │                      │
│  │ └────┴──────┴────────┴─────────┘   │                      │
│  └────────────────────────────────────┘                      │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Chat with Assistant                                    │  │
│  │                                                        │  │
│  │ [user]: Stok turun parah minggu ini, harusnya saya    │  │
│  │         restock berapa?                                │  │
│  │                                                        │  │
│  │ [agent]: Berdasarkan data 30 hari terakhir...         │  │
│  │   • Average daily sales: 8.2 unit                     │  │
│  │   • Current stock: 12 unit                            │  │
│  │   • Estimated depletion: 1.5 hari                     │  │
│  │   • Lead time supplier: 7 hari                        │  │
│  │   • Recommended order: 75 unit (untuk 9 hari + buffer)│  │
│  │                                                        │  │
│  │   Mau saya buat PO otomatis ke supplier utama?        │  │
│  │                                                        │  │
│  │ ┌──────────────────────────────────────────────────┐   │  │
│  │ │ > _                                              │   │  │
│  │ └──────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────┬─────────────────────┘  │
│                                     │                        │
│                          ┌──────────▼──────────┐             │
│                          │ SSE: POST /chat     │             │
│                          │                      │             │
│                          │ Agent tools:        │             │
│                          │  query_avg_daily    │             │
│                          │  query_lead_time    │             │
│                          │  create_po          │             │
│                          └─────────────────────┘             │
└──────────────────────────────────────────────────────────────┘
```

## Klaster endpoints yang biasanya muncul

```
Klaster 1: READ HEAVY, FAST DISPLAY     → REST (Express route biasa)
────────────────────────────────────────
- Product list
- Order history
- Stock dashboard
- Report CSV download
- Search (Postgres FTS)


Klaster 2: USER INTERACTION, REASONING   → Agent (Pi)
────────────────────────────────────────
- "Jawab pertanyaan bebas" chat
- Rekomendasi
- Decision support
- Multi-step workflow
- Compose pesan/email
- Investigasi anomaly


Klaster 3: AUTOMATION/BACKGROUND         → Worker + Agent
────────────────────────────────────────
- Nightly report generation
- Anomaly detection cron
- Email triage
- Document processing queue


Klaster 4: REAL-TIME PUSH                → WebSocket + (optional) Agent
────────────────────────────────────────
- Live order updates
- Stock threshold alerts
- Chat collaboration
```
