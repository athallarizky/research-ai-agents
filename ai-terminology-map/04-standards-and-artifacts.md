# Protokol, Standar, Konvensi, dan Artifak

Kategori 6 (protokol/standar) dan 7 (artifak). Praktis dan sering tertukar:
AGENTS.md itu artifak, tapi *praktik memakai AGENTS.md lintas repo* adalah
konvensi/de-facto standard. File ini memetakan semuanya.

## Protokol / standar

### MCP — Model Context Protocol [protokol]
Standar terbuka untuk menghubungkan model ke tools & data eksternal
(server ↔ client). Interoperabilitas: satu MCP server bisa dipakai Claude
Code, Cursor, Continue, dsb. Speknya mengatur transport, schema tool, auth.
Lihat pembandingannya dengan tool runtime di
[`../pi-agent-core/07-pi-and-mcp.md`](../pi-agent-core/07-pi-and-mcp.md).

### A2A — Agent-to-Agent [protokol]
Protokol agar agent buatan pihak berbeda bisa saliing menemukan dan
berkomunikasi (beda fokus dari MCP: MCP = agent ↔ tools, A2A = agent ↔ agent).

### Function/tool calling schema [standar de-facto]
Format JSON Schema untuk mendeklarasikan tool ke model. Dulu vendor-specific,
kini konvergen (OpenAI tools, Anthropic tool_use, Gemini function calling
hampir isomorfis).

### Session interchange format [standar + artifak]
Spec di repo ini: format markdown portabel untuk menyimpan/menabur konteks
sesi lintas tool. Spec = protokol; file session yang dihasilkan = artifak.
Lihat [`../session-interchange-format/SPEC.md`](../session-interchange-format/SPEC.md).

## Konvensi (antara standar dan artifak)

Konvensi = kesepakatan sosial tanpa badan spefikasi. Ngotot-ngototannya:
tidak ada yang "memaksa", tapi ekosistem patuh.

- **AGENTS.md** — konvensi file instruksi untuk agent di root repo. Diadopsi
  lintas tool (Claude Code, Cursor, Codex, dsb.)
- **CLAUDE.md / .cursorrules / equivalent** — varian per-tool; arah tren:
  konvergensi ke AGENTS.md sebagai nama netral
- **Skills directory (`SKILL.md`)** — konvensi Claude Code untuk paket
  instruksi + resource yang dimuat on-demand; satu primitif loop engineering
- **Conventional commits** — konvensi git, dipakai repo ini

## Artifak

| Artifak | Kategori isinya | Perannya di stack |
|---|---|---|
| system prompt | instruksi | objek prompt engineering |
| tool schema (JSON) | deklarasi | objek harness engineering |
| `SKILL.md` | instruksi + resource | primitif loop engineering |
| session file | konteks tersimpan | objek context engineering (portabilitas) |
| graph definition (`StateGraph`) | kode | objek graph engineering |
| eval suite | kode + kasus uji | objek metrik/eval |
| transcript `.jsonl` | data mentah | bahan mentah sebelum dikompaksi jadi session file |

## Pola praktis: dari protokol ke artifak

Rantai tipikal saat membangun agent:

```
protokol (MCP)  →  dipakai lewat artifak (server code + tool schema)
konvensi        →  dipatuhi lewat artifak (AGENTS.md di repo)
metodologi      →  diterapkan lewat artifak (prompt, graph def, skills)
```

Jadi kalau bingung memilah: tanyakan "apakah yang saya pegang ini
**spesifikasinya** atau **hasilnya**?" — spesifikasi = protokol/standar,
hasil = artifak.

## Rambu anti-tertukar

1. **AGENTS.md ≠ protokol** — filenya artifak; praktik lintas-tool-nya
   konvensi; tidak ada badan standardisasi
2. **MCP ≠ arsitektur agent** — MCP protokol konektivitas; arsitekturnya tetap
   kamu yang desain
3. **Session file ≠ transcript** — transcript = data mentah `.jsonl`;
   session file = artifak terkurasi + teredaksi
