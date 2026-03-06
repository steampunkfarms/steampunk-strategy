#!/usr/bin/env bash
# validate-env.sh — Pre-commit guard for .env.local hygiene
#
# Checks .env.local (if it exists and is staged) for common corruption:
#   - Trailing \r (carriage return) — breaks secrets on Unix systems
#   - Trailing spaces or tabs after values — can silently corrupt API keys
#   - Embedded \r within values
#
# Exit codes:
#   0 — All clean (or .env.local not staged / doesn't exist)
#   1 — Issues found; commit should be rejected
#
# Usage:
#   ./scripts/validate-env.sh          # Manual run (checks file on disk)
#   Called automatically via .husky/pre-commit
#
# Idempotent: read-only, no side effects.

set -euo pipefail

ENV_FILE=".env.local"
ERRORS=0

# ── Check if .env.local is relevant to this commit ───────────────────
# When called from a pre-commit hook, only validate if .env.local is staged.
# When called manually (no git index context), validate if the file exists.

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  # We're in a git repo — check if .env.local is staged
  if ! git diff --cached --name-only | grep -q "^${ENV_FILE}$"; then
    # .env.local is not staged for this commit — nothing to validate
    exit 0
  fi
fi

# ── Verify file exists ───────────────────────────────────────────────

if [ ! -f "$ENV_FILE" ]; then
  # File doesn't exist on disk — nothing to check
  exit 0
fi

echo "Validating $ENV_FILE..."

# ── Line-by-line validation ──────────────────────────────────────────
# Read raw bytes — IFS='' and -r preserve whitespace and backslashes.
# We do NOT use `while read` default behavior which strips \r.

LINE_NUM=0

while IFS='' read -r line || [ -n "$line" ]; do
  LINE_NUM=$((LINE_NUM + 1))

  # Skip empty lines and comments
  if [ -z "$line" ] || echo "$line" | grep -qE '^\s*#'; then
    continue
  fi

  # Skip lines without = (shouldn't happen in valid .env, but be safe)
  if ! echo "$line" | grep -q '='; then
    continue
  fi

  # Extract key (everything before first =)
  KEY="$(echo "$line" | cut -d= -f1 | tr -d '[:space:]')"
  # Extract value (everything after first =), preserving raw content
  VALUE="$(echo "$line" | cut -d= -f2-)"

  # Check 1: Trailing \r (carriage return)
  # printf %q makes \r visible as $'\r' or \r
  if printf '%s' "$VALUE" | grep -qP '\r'; then
    echo "  LINE $LINE_NUM: $KEY has trailing \\r (carriage return)"
    ERRORS=$((ERRORS + 1))
  fi

  # Check 2: Trailing spaces or tabs after the value
  if printf '%s' "$VALUE" | grep -qP '[ \t]+$'; then
    echo "  LINE $LINE_NUM: $KEY has trailing whitespace (spaces or tabs)"
    ERRORS=$((ERRORS + 1))
  fi

done < "$ENV_FILE"

# ── Report ────────────────────────────────────────────────────────────

if [ "$ERRORS" -gt 0 ]; then
  echo ""
  echo "$ERRORS issue(s) found in $ENV_FILE — commit rejected."
  echo "Fix the values and re-stage the file."
  exit 1
fi

echo ".env.local is clean"
exit 0
