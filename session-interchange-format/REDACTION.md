# Redaction Rules

**Default to redacting.** When in doubt, redact. A leaked email or path in a public repo cannot be reliably un-leaked.

## Why Redact

Even when sessions are stored in a private repository:

1. **Private repos leak.** Accidental permission changes, cloned forks, compromised tokens, future migration to public — all real risks.
2. **Patterns reveal more than contents.** A redacted email body still reveals "this person communicated with that person at this time."
3. **Future-you may publish.** What feels safe today may feel less safe in two years.
4. **Cost of redaction is low.** Cost of leakage is high. Asymmetric bet.

## Mandatory Redactions

### 1. Email Addresses

**Pattern:** `<local-part>@<domain>`

**Action:** Replace with role-based placeholder.

```diff
- Contact me at alice@company.com for details
+ Contact the maintainer for details

- Push dari athallarizk@gmail.com
+ Push dari email athalla
```

### 2. File System Paths (Absolute)

**Pattern:** `/home/<user>/...`, `/Users/<user>/...`, `/data/data/<pkg>/...`, `C:\Users\<user>\...`, etc.

**Action:** Replace with `<path-redacted>` or use relative paths only.

```diff
- Located at /data/data/com.termux/files/home/development/research-ai-agents/
+ Located at the repo root

- Stored in /Users/alice/.config/agent/
+ Stored in the agent's config directory
```

### 3. Usernames & Real Names

**Pattern:** Names of private individuals (including the author's real name when used as identifier).

**Action:** Replace with role or omit. Public handles (GitHub usernames tied to public repos) are fine.

```diff
- Discussed with Bob and Alice
+ Discussed with two collaborators

- Athalla configured SSH key
+ Author configured SSH key
```

### 4. IP Addresses

**Pattern:** IPv4 (`X.X.X.X`) and IPv6.

**Action:** Replace with `<ip-redacted>`. Localhost (`127.0.0.1`, `::1`) is fine to keep.

```diff
- Server running on 192.168.1.100:8080
+ Server running on a LAN address

- Database at 10.0.0.5
+ Database on internal network
```

### 5. API Keys, Tokens, Passwords, Secrets

**Pattern:** Anything matching known secret formats (`sk-...`, `AKIA...`, `ghp_...`, `Bearer ...`, `xoxb-...`, etc.) or labeled as secret.

**Action:** **Never include.** Verify absence explicitly before saving. If a secret was accidentally captured, rewrite history (force-push only to private branches, rotate the secret immediately).

```diff
- ANTHROPIC_API_KEY=sk-ant-...
+ ANTHROPIC_API_KEY=<in-env-file>

- Authorization: Bearer eyJ...
+ Authorization header with bearer token
```

### 6. Internal Hostnames

**Pattern:** Hostnames that reveal internal infrastructure (`db.internal.corp`, `staging-01.prod`, etc.).

**Action:** Replace with `<host-redacted>` or generic role.

```diff
- Deployed to pi-server.lan
+ Deployed to the agent server

- Connected to indomaret-db.internal
+ Connected to the application database
```

### 7. Phone Numbers

**Pattern:** International phone format (`+62 812-XXXX-XXXX`, etc.).

**Action:** Replace with `<phone-redacted>`.

### 8. URLs Behind Auth

**Pattern:** URLs that require authentication and would reveal internal structure even when redacted (`https://internal.corp/jira/PROJECT-123`, Confluence links, internal Notion, etc.).

**Action:** Replace with description. Public URLs are fine to keep.

```diff
- Ticket at https://internal.corp/jira/ENG-1234
+ Internal ticket for engineering review
```

## Contextual Redactions

Beyond patterns, watch for contextual leaks:

| Risk | Example | Action |
|---|---|---|
| Personal project names | "Working on Project Sunburst" (codename for unreleased product) | Genericize |
| Internal team names | "Coordinated with the Phoenix team" | Replace with function |
| Customer / client names | "Client Acme Corp requested..." | Replace with industry or sector |
| Geographic specifics | "Office in Jakarta Selatan" | Genericize to city or remove |
| Time zones + schedule | "Standup at 9am WIB reveals..." | Remove specific time |
| Salary / budget figures | "$50K allocated" | Remove or round heavily |

## What NOT to Redact

- Public information (open-source repo URLs, public docs, public API specs)
- Author's own public identity (when explicitly intended)
- General technical concepts (Pi, LangChain, MCP, etc.)
- Industry-standard terminology
- URLs of public resources

## Validation

Before saving, run this mental (or scripted) check:

```bash
# Pseudo-checks
grep -E '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' file.md  # emails
grep -E '/(home|Users|data)/[a-z]' file.md                          # abs paths
grep -E '\b[0-9]{1,3}(\.[0-9]{1,3}){3}\b' file.md                   # IPv4
grep -E '(sk-[a-zA-Z0-9]{20}|ghp_[a-zA-Z0-9]{36}|AKIA[A-Z0-9]{16})' file.md  # secrets
grep -E '\+[0-9]{1,3} [0-9]' file.md                                # phones
```

If any match (except in `## References` for public URLs), redact and re-check.

## Edge Cases

### Quoted Code

Code blocks may legitimately contain email-like or path-like patterns (e.g., example configs). Wrap with explicit `<example>` markers if needed:

```diff
- config.email = "user@example.com"
+ config.email = "user@example.com"  # <example>
```

Or use clearly fake values:

```
config.email = "alice@example.com"   # placeholder
```

### Public Person Identifying as Author

If the author's public identity (e.g., GitHub username) is intentionally attributed, it's fine to keep. The redaction rule is about *non-public* PII and *incidental* leakage.

### Cross-Reference to Other Sessions

When referencing another session file, use its `session_id` only — never its filesystem path:

```diff
- Continues from /home/alice/sessions/foo-2026-08-01.md
+ Continues from session_id: foo-2026-08-01
```

## Tooling (Future)

Planned tooling (not yet implemented in v0.1.0):

- `redactor.mjs` — auto-scan and redact using regex rules above
- `validator.mjs` — schema validation for frontmatter + sections
- `compactor.mjs` — Claude Code `.jsonl` → session-interchange `.md`
- `pre-commit` hook — block commits containing unredacted PII

Until these exist, redaction is manual (or done by the agent writing the file, with this doc as reference).
