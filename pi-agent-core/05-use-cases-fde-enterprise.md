# 05 — Use Cases: FDE & Enterprise

## Untuk Forward Deployed Engineer (FDE)

### Kenapa Pi fit dengan workflow FDE

FDE biasanya: ship cepat di lokasi customer, integrate ke stack mereka, lalu jadi production. Pi fit dengan pola ini:

| Kebutuhan FDE | Apa Pi kasih |
|---|---|
| Deploy ke VPC customer (on-prem/private cloud) | `pi-server` + `pi-client` + `pi-protocol` split jelas |
| Multi-provider (customer dictate LLM vendor) | `pi-ai` — abstraksi OpenAI/Anthropic/Google/Azure |
| Observability + bukti ROI ke customer | `pi-telemetry` + `pi-evals` |
| Integrate ke SSO/RBAC customer yang sudah ada | **Pi tidak paksa identity system** — plug sendiri |
| Strict governance audit | TypeBox schemas + tool hooks → audit trail |
| Procurement cepat | MIT + pinned deps → legal/security review ringan |
| Iterasi cepat onsite | TypeScript + monorepo → prototyping cepat |

**Inti:** Pi nggak memaksakan opinion tentang auth/billing/tenancy, dan ini *asset* untuk FDE karena setiap enterprise customer punya stack berbeda.

### Use case realistis untuk FDE

1. **Internal ops agent untuk customer** — agent baca Jira internal mereka, generate report, eksekusi runbook
2. **Customer-specific coding agent** — agent coding di repo customer dengan knowledge mereka
3. **Knowledge assistant** — agent query DB/data warehouse customer via tools
4. **Workflow automation** — proses dokumen legal/financial dengan human-in-the-loop via hooks `beforeToolCall`/`afterToolCall`
5. **Migration assistant** — agent bantu pindah dari system lama ke baru

### Test decision cepat untuk FDE

**PAKAI Pi kalau:**
- Customer butuh agent custom dalam minggu, bukan bulan
- Customer dictate LLM vendor (bisa ganti-ganti)
- Kamu kontrol deployment environment (VPC/on-prem)
- Identity system ikut customer yang sudah ada

**JANGAN pakai Pi (atau cari alternatif) kalau:**
- Customer butuh SLA komersial dari vendor agent layer
- Regulated industry dengan audit yang demand vendor compliance certification
- Multi-tenant SaaS dengan banyak customer share instance (Pi desain untuk per-deployment, bukan multi-tenant)
- Kamu butuh RAG/orchestration kompleks (LangChain/LlamaIndex lebih cocok)

### Verdict FDE

**Valid untuk 80% use case FDE**, terutama yang sifatnya *custom deployment per customer*. Untuk 20% sisanya (regulated + SLA-driven + multi-tenant), Pi tetap bisa dipakai tapi sebagai salah satu komponen, bukan foundation.

## Untuk Enterprise Level

### Yang sudah ada di Pi

| Komponen | Manfaat |
|---|---|
| `pi-telemetry` | Observability hooks |
| `pi-session-backends` | Persistence |
| `pi-server` + `pi-client` + `pi-protocol` | Client/server split siap pakai |
| `pi-evals` | Testing agent behavior |
| Pinned deps | Supply-chain discipline ketat |
| MIT license | Procurement mudah |
| TypeScript | Type safety, governance |

### Yang tidak ada (harus di-build di atas)

| Komponen | Notes |
|---|---|
| Permission system | README eksplisit bilang "runs with user permissions", harus containerization |
| RBAC / multi-tenancy auth | Build sendiri |
| Rate limiting, cost tracking per-user | Build sendiri |
| Audit log siap pakai | Hanya hooks via telemetry |
| GUI admin / dashboard | Build sendiri |
| Compliance certifications (SOC2/HIPAA/ISO27001) | Tanggung jawab kamu, bukan Pi |

### Use case enterprise realistis

1. **Custom coding agent CLI** untuk domain kamu
2. **Domain-specific assistant** dengan TUI — agent internal ops Indomaret yang baca DB, jalankan script, monitoring
3. **Chat agent multi-provider** — fallback OpenAI → Anthropic → Google otomatis
4. **Browser/automation agent** — agent drive tooling Android via ADB
5. **Agent server** — expose agent via HTTP/WebSocket pakai `pi-server`

### Konteks Indonesia/SEAsia

Kalau customer BUMN/bank/regulator yang demand vendor SLA lokal:
- Pi bagus sebagai **internal toolkit** tim engineering kamu
- Jangan expose sebagai produk yang dijual langsung tanpa wrapper bisnis di atasnya
- Pertimbangkan SLA lokal + entity Indonesia untuk commercial wrapper

## Konteks spesifik: Indomaret Automation

Berdasarkan memory project: AutoJs6 + Accessibility di Android 16. Pi cocok sebagai **"otak"** untuk agent itu:

- `pi-agent-core` → loop yang decide aksi berikutnya
- Tools custom:
  - `click_button(selector)` → wrap AutoJs6 click()
  - `read_screen()` → wrap Accessibility tree
  - `fill_form(field, value)` → wrap input
  - `navigate_menu(path)` → wrap navigation
  - `wait_for_state(condition)` → polling
- `pi-tui` → kalau mau CLI monitoring
- `pi-server` → kalau mau jalankan dari HP tapi dikontrol dari laptop

### Arsitektur yang direkomendasikan

```
┌──────────────────────────────┐
│  HP Android (Termux + AutoJs6)│
│  ├─ Accessibility Service    │
│  ├─ AutoJs6 script runner    │
│  └─ HTTP client → server     │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│  Pi Server (laptop/VPS)      │
│  ├─ pi-agent-core            │
│  ├─ Tools:                   │
│  │   ├─ click_via_autojs     │
│  │   ├─ read_screen          │
│  │   ├─ check_cart           │
│  │   └─ take_screenshot      │
│  └─ State: conversation,     │
│           last screen, dll   │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│  Anthropic / OpenAI API      │
└──────────────────────────────┘
```

Keuntungan pakai Pi untuk konteks ini:
- **Decision-making fleksibel** — agent bisa adapt ke UI Indomaret yang berubah
- **Recovery otomatis** — kalau pop-up ganggu, agent bisa handle
- **Audit trail** — telemetry log semua aksi untuk debugging
- **Multi-step planning** — "checkout 5 item" → plan sendiri langkahnya
