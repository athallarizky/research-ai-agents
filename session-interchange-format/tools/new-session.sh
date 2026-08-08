#!/usr/bin/env bash
# new-session.sh — v0.1.0
# Scaffold a new session-interchange-format file from TEMPLATE.md.
# Usage: ./new-session.sh <topic-slug> [date YYYY-MM-DD]
# Creates: ./sessions/<topic-slug>-<date>.md (or ./<topic-slug>-<date>.md if no sessions/ dir)
# After creation, edit the file then validate with validate.mjs.

set -euo pipefail

TOPIC="${1:-}"
DATE="${2:-$(date +%Y-%m-%d)}"

if [ -z "$TOPIC" ]; then
  echo "Usage: $0 <topic-slug> [date YYYY-MM-DD]" >&2
  echo "" >&2
  echo "  topic-slug: kebab-case, e.g. pi-agent-core" >&2
  echo "  date:       ISO date, defaults to today" >&2
  exit 2
fi

# Validate topic-slug format
if ! echo "$TOPIC" | grep -Eq '^[a-z0-9][a-z0-9-]*$'; then
  echo "Error: topic-slug must be kebab-case (lowercase, digits, hyphens only)" >&2
  exit 2
fi

# Validate date format
if ! echo "$DATE" | grep -Eq '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'; then
  echo "Error: date must be YYYY-MM-DD" >&2
  exit 2
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEMPLATE="$SCRIPT_DIR/../TEMPLATE.md"

if [ ! -f "$TEMPLATE" ]; then
  echo "Error: TEMPLATE.md not found at $TEMPLATE" >&2
  exit 2
fi

# Determine output directory
if [ -d "./sessions" ]; then
  OUTDIR="./sessions"
elif [ -d "../sessions" ]; then
  OUTDIR="../sessions"
else
  OUTDIR="."
fi

OUTFILE="$OUTDIR/$TOPIC-$DATE.md"

if [ -f "$OUTFILE" ]; then
  echo "Error: file already exists: $OUTFILE" >&2
  exit 1
fi

cp "$TEMPLATE" "$OUTFILE"

echo "Created: $OUTFILE"
echo ""
echo "Next steps:"
echo "  1. Edit $OUTFILE — replace placeholders with real content"
echo "  2. Apply redaction rules from REDACTION.md"
echo "  3. Validate:  node $SCRIPT_DIR/validate.mjs $OUTFILE"
echo "  4. Scan PII:  node $SCRIPT_DIR/redact-scan.mjs $OUTFILE"
echo "  5. Commit (signed, conventional commit message)"
