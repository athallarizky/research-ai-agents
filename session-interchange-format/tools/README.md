# Tools for Session Interchange Format

Optional, agent-agnostic tools for working with session-interchange-format files. None are required — the format spec is the contract, these are conveniences.

## Requirements

- **Node.js** ≥ 18 (for `.mjs` scripts)
- **Bash** (for `.sh` scripts)
- No external dependencies (standard library only)

## Tools

| Tool | Purpose | Usage |
|---|---|---|
| `validate.mjs` | Validate a session file against spec v0.1.0 | `node validate.mjs <file.md>` |
| `redact-scan.mjs` | Scan a session file for potential PII patterns | `node redact-scan.mjs <file.md>` |
| `new-session.sh` | Scaffold a new session file from TEMPLATE.md | `./new-session.sh <topic-slug> [date]` |
| `compact-claude-code.mjs` | Convert Claude Code `.jsonl` transcript to session `.md` draft | `node compact-claude-code.mjs <input.jsonl> --topic <slug> [options]` |

## Exit Codes

All tools use Unix convention:
- `0` — success
- `1` — validation/scan failure (file invalid or PII found)
- `2` — usage error (bad arguments, file not found)

## Pipeline Example

```bash
# 1. Scaffold a new session file
./new-session.sh my-research-topic

# 2. Edit it (manually or have agent write it)
$EDITOR sessions/my-research-topic-2026-08-08.md

# 3. Validate
node validate.mjs sessions/my-research-topic-2026-08-08.md

# 4. Scan for PII
node redact-scan.mjs sessions/my-research-topic-2026-08-08.md

# 5. Commit (only after both pass)
git add sessions/my-research-topic-2026-08-08.md
git commit -S -m "docs: add session for my-research-topic"
```

## Pre-commit Hook (optional)

To run validator + redactor automatically before commits, add to `.git/hooks/pre-commit`:

```bash
#!/usr/bin/env bash
set -e
for f in $(git diff --cached --name-only --diff-filter=ACM | grep "^sessions/.*\.md$"); do
  node session-interchange-format/tools/validate.mjs "$f"
  node session-interchange-format/tools/redact-scan.mjs "$f"
done
```

Make executable: `chmod +x .git/hooks/pre-commit`.

## Compactor (Claude Code specific)

The compactor converts a Claude Code `.jsonl` transcript to a draft session `.md`. **The output is a rough draft** — always review and edit before committing.

```bash
node compact-claude-code.mjs ~/.claude/projects/.../session.jsonl \
  --topic "my-research" \
  --agent "Claude Code (Sonnet 4.5)" \
  > sessions/my-research-2026-08-08.md
```

The compactor applies basic redaction inline. Heuristics extract:
- First user message → Context section
- Bulleted items → Key Findings / Notable Decisions
- Question lines in last user messages → Open Threads
- URLs → References

## Limitations

- YAML parser is minimal (handles common cases only — flat keys, inline arrays, block arrays)
- PII scanner uses regex patterns; sophisticated obfuscation may be missed
- Compactor heuristics are basic; expect ~50% recall on findings/decisions
- All tools are stateless; no caching

## Contributing

These tools are part of the spec. To propose changes:
1. Open an issue describing the change
2. Test against existing examples
3. Submit PR with updated tests/examples

## Versioning

Tools version independently from spec. Spec version is checked by `validate.mjs`. Tool version is in each script's header comment.
