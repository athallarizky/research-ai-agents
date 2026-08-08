# 01 — Apa itu Pi?

## Definisi singkat

Pi adalah **AI agent toolkit** yang menyediakan:
1. Unified multi-provider LLM API (OpenAI, Anthropic, Google, Azure, dll.)
2. Agent runtime dengan tool calling + state management
3. Interactive coding agent CLI (produk siap pakai, mirip Claude Code)
4. Terminal UI library dengan differential rendering

## Posisi di landscape

Pi **bukan** orchestration framework seperti LangChain. Pi lebih dekat ke **Claude Code harness yang di-open-source** — yaitu runtime/loop + tools, bukan graph/DAG workflow engine.

## Fakta repo (per Agustus 2026)

| Atribut | Nilai |
|---|---|
| URL | https://github.com/earendil-works/pi |
| Stars | ~84,794 |
| Forks | ~10,502 |
| Created | 2025-08-09 (~1 tahun) |
| License | MIT |
| Language | TypeScript (monorepo) |
| Org | earendil-works |
| Activity | Active development, 5,535+ commits |

## Packages di monorepo (10 paket)

| Package | Fungsi |
|---|---|
| `pi-agent` | Agent runtime dengan tool calling + state management (**inti**) |
| `pi-ai` | Unified multi-provider LLM API |
| `pi-coding-agent` | Interactive coding agent CLI (produk) |
| `pi-tui` | Terminal UI library dengan differential rendering |
| `pi-telemetry` | Vendor-neutral telemetry contracts |
| `pi-server` | Server-side runtime untuk deployment |
| `pi-client` | Client SDK untuk konsumsi agent |
| `pi-protocol` | Wire protocol antara client ↔ server |
| `pi-session-backends` | Persistence (DB adapters untuk session state) |
| `pi-evals` | Testing agent behavior secara sistematis |

## Yang tidak dimiliki (eksplisit)

- **Permission system built-in** — README bilang: "runs with the permissions of the user and process that launched it". Butuh containerization untuk isolation.
- **RBAC / SSO / multi-tenancy** — harus di-build di atas
- **RAG primitives** (chunker, loader, vector store) — harus rakit sendiri atau pakai pihak ketiga
- **SLA komersial** — org kecil, bukan Anthropic/OpenAI

## Supply chain discipline

- Direct dependencies pinned to exact versions
- Package-lock.json sebagai ground truth
- Published CLI packages include shrinkwrap files
- Dependency changes treated as reviewed code

## Cara development setup

```bash
npm install --ignore-scripts
npm run build
npm run check
./test.sh
```

Untuk build standalone binaries dari release source:

```bash
VERSION="<release-version>"
tar -xzf "pi-${VERSION}-source.tar.gz"
cd "pi-${VERSION}"
./scripts/build-binaries.sh --offline-model-data --platform linux-x64 --out "$PWD/out"
```

## Containerization patterns (didokumentasikan)

Tiga pola untuk isolation:
1. **Gondolin extension** (Linux micro-VM)
2. **Plain Docker**
3. **OpenShell sandbox**

Lihat `packages/coding-agent/docs/containerization.md` di repo.
