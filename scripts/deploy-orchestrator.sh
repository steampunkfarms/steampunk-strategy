#!/usr/bin/env bash
# deploy-orchestrator.sh — ORCH-101 deployment script
#
# Pushes the Orchestrator and sibling repos to GitHub, applies the DB schema,
# and seeds the job registry. Designed to be idempotent — safe to re-run.
#
# Usage:
#   ./scripts/deploy-orchestrator.sh
#
# Prerequisites:
#   - git push access to all repos (SSH key or gh auth)
#   - INTERNAL_SECRET env var or prompted interactively
#   - Orchestrator deployed on Vercel with DATABASE_URL configured
#
# see docs/handoffs/orchestrator-enhancement.md — Deployment steps

set -euo pipefail

# ── Configuration ───────────────────────────────────────────────────────

WORKSPACE="/Users/ericktronboll/Projects"
ORCHESTRATOR_DIR="$WORKSPACE/steampunk-orchestrator"
ORCHESTRATOR_URL="${ORCHESTRATOR_URL:-https://steampunk-orchestrator.vercel.app}"

SIBLING_REPOS=(
  "steampunk-studiolo"
  "steampunk-postmaster"
  "steampunk-rescuebarn"
  "cleanpunk-shop"
  "steampunk-strategy"
)

# ── Helpers ─────────────────────────────────────────────────────────────

log()   { printf "\n\033[1;34m==> %s\033[0m\n" "$1"; }
ok()    { printf "    \033[0;32m%s\033[0m\n" "$1"; }
warn()  { printf "    \033[0;33m%s\033[0m\n" "$1"; }
fail()  { printf "    \033[0;31m%s\033[0m\n" "$1"; exit 1; }

# Check that a directory exists and has a git repo
check_repo() {
  local dir="$1"
  if [ ! -d "$dir/.git" ]; then
    fail "Not a git repo: $dir"
  fi
}

# Push a repo to origin main, skipping if already up to date
push_repo() {
  local dir="$1"
  local name
  name="$(basename "$dir")"

  check_repo "$dir"

  # Check if there are commits to push
  local ahead
  ahead="$(git -C "$dir" rev-list --count origin/main..HEAD 2>/dev/null || echo "unknown")"

  if [ "$ahead" = "0" ]; then
    ok "$name: already up to date with origin/main"
    return 0
  fi

  log "Pushing $name ($ahead commit(s) ahead)..."
  if git -C "$dir" push origin main; then
    ok "$name: pushed successfully"
  else
    fail "$name: push failed"
  fi
}

# ── Step 0: Resolve INTERNAL_SECRET ─────────────────────────────────────

if [ -z "${INTERNAL_SECRET:-}" ]; then
  # Try to read from orchestrator's .env or .env.local
  for envfile in "$ORCHESTRATOR_DIR/.env.local" "$ORCHESTRATOR_DIR/.env"; do
    if [ -f "$envfile" ]; then
      val="$(grep -E '^INTERNAL_SECRET=' "$envfile" 2>/dev/null | head -1 | cut -d= -f2-)"
      if [ -n "$val" ]; then
        INTERNAL_SECRET="$val"
        ok "Read INTERNAL_SECRET from $envfile"
        break
      fi
    fi
  done
fi

if [ -z "${INTERNAL_SECRET:-}" ]; then
  printf "\nINTERNAL_SECRET not found in env or .env files.\n"
  printf "Enter INTERNAL_SECRET (used to authenticate admin API calls): "
  read -r INTERNAL_SECRET
  if [ -z "$INTERNAL_SECRET" ]; then
    fail "INTERNAL_SECRET is required to seed the job registry."
  fi
fi

# ── Step 0.5: Sanitize env values ────────────────────────────────────────
# Safety net: strip trailing \r (carriage return) from values read from
# .env files. Windows line endings or dashboard copy-paste can introduce
# invisible \r characters that silently break API keys, secrets, and
# connection strings. This catches anything the pre-commit hook missed.
#
# We sanitize INTERNAL_SECRET (already resolved above) and also scan the
# orchestrator's .env.local to warn about any other corrupted values.

SANITIZED_COUNT=0

# Sanitize INTERNAL_SECRET — the value we'll actually use for API calls.
# tr -d '\r' strips all carriage return characters from the string.
CLEAN_SECRET="$(printf '%s' "$INTERNAL_SECRET" | tr -d '\r')"
if [ "$CLEAN_SECRET" != "$INTERNAL_SECRET" ]; then
  INTERNAL_SECRET="$CLEAN_SECRET"
  SANITIZED_COUNT=$((SANITIZED_COUNT + 1))
  warn "Stripped trailing \\r from INTERNAL_SECRET"
fi

# Scan orchestrator's .env.local for any other vars with \r.
# This is informational only — we don't rewrite the file, just warn.
for envfile in "$ORCHESTRATOR_DIR/.env.local" "$ORCHESTRATOR_DIR/.env"; do
  if [ -f "$envfile" ]; then
    # grep -P '\r' finds lines containing carriage return.
    # We extract just the key name for the warning message.
    while IFS='' read -r line; do
      key="$(echo "$line" | cut -d= -f1)"
      if [ -n "$key" ]; then
        SANITIZED_COUNT=$((SANITIZED_COUNT + 1))
        warn "Found trailing \\r in $key ($(basename "$envfile"))"
      fi
    done < <(grep -P '\r' "$envfile" 2>/dev/null | grep -v '^\s*#' || true)
    break  # Only check the first .env file found (same precedence as Step 0)
  fi
done

if [ "$SANITIZED_COUNT" -gt 0 ]; then
  warn "Found and stripped/detected trailing \\r from $SANITIZED_COUNT var(s). Check .env.local for issues."
else
  ok "No sanitization needed — env values are clean"
fi

# ── Step 1: Apply Prisma schema to Orchestrator DB ──────────────────────
# Idempotent: db push only applies changes that haven't been applied yet.

log "Applying Prisma schema (db push)..."
cd "$ORCHESTRATOR_DIR"
if npx prisma db push --accept-data-loss 2>&1; then
  ok "Prisma schema applied"
else
  fail "prisma db push failed — check DATABASE_URL in .env"
fi

# ── Step 2: Push Orchestrator to GitHub ─────────────────────────────────
# Must deploy before seeding so the admin API endpoint exists.

log "Pushing steampunk-orchestrator..."
push_repo "$ORCHESTRATOR_DIR"

# ── Step 3: Wait for Vercel deployment ──────────────────────────────────
# Poll the admin API endpoint until it responds (max 5 min).

log "Waiting for Vercel deployment (polling /api/admin/jobs)..."
MAX_WAIT=300  # 5 minutes
INTERVAL=15
ELAPSED=0

while [ "$ELAPSED" -lt "$MAX_WAIT" ]; do
  HTTP_CODE="$(curl -s -o /dev/null -w '%{http_code}' \
    -H "Authorization: Bearer $INTERNAL_SECRET" \
    "$ORCHESTRATOR_URL/api/admin/jobs" 2>/dev/null || echo "000")"

  if [ "$HTTP_CODE" = "200" ]; then
    ok "Orchestrator is live (HTTP $HTTP_CODE)"
    break
  fi

  warn "Not ready yet (HTTP $HTTP_CODE), retrying in ${INTERVAL}s... (${ELAPSED}s/${MAX_WAIT}s)"
  sleep "$INTERVAL"
  ELAPSED=$((ELAPSED + INTERVAL))
done

if [ "$ELAPSED" -ge "$MAX_WAIT" ]; then
  warn "Timed out waiting for deployment. Attempting seed anyway..."
fi

# ── Step 4: Seed job registry ───────────────────────────────────────────
# POST /api/admin/jobs syncs all static registry jobs into the DB.
# Idempotent: existing jobs are updated (preserving admin overrides),
# new jobs are created.

log "Seeding job registry (POST /api/admin/jobs)..."
SEED_RESPONSE="$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $INTERNAL_SECRET" \
  -H "Content-Type: application/json" \
  "$ORCHESTRATOR_URL/api/admin/jobs")"

SEED_BODY="$(echo "$SEED_RESPONSE" | head -n -1)"
SEED_CODE="$(echo "$SEED_RESPONSE" | tail -1)"

if [ "$SEED_CODE" = "200" ]; then
  ok "Registry seeded: $SEED_BODY"
else
  warn "Seed returned HTTP $SEED_CODE: $SEED_BODY"
  warn "You may need to seed manually after deployment completes."
fi

# ── Step 5: Push sibling repos ──────────────────────────────────────────
# Each repo had its orchestrator-managed crons removed from vercel.json.
# Pushing triggers Vercel redeploy, which drops those cron schedules.

log "Pushing sibling repos..."
for repo in "${SIBLING_REPOS[@]}"; do
  push_repo "$WORKSPACE/$repo"
done

# ── Step 6: Verify job count ────────────────────────────────────────────
# Quick sanity check: ensure the registry has 24 jobs.

log "Verifying job registry..."
VERIFY_RESPONSE="$(curl -s \
  -H "Authorization: Bearer $INTERNAL_SECRET" \
  "$ORCHESTRATOR_URL/api/admin/jobs" 2>/dev/null || echo "{}")"

JOB_COUNT="$(echo "$VERIFY_RESPONSE" | grep -o '"count":[0-9]*' | cut -d: -f2 || echo "?")"

if [ "$JOB_COUNT" = "24" ]; then
  ok "Registry has $JOB_COUNT jobs — all accounted for"
else
  warn "Registry has $JOB_COUNT jobs (expected 24) — check /api/admin/jobs"
fi

# ── Done ────────────────────────────────────────────────────────────────

log "Deployment complete."
printf "\n"
printf "  Next step: Set ORCHESTRATOR_ENABLED=true in Vercel env vars\n"
printf "  Project:   steampunk-orchestrator\n"
printf "  Location:  Vercel Dashboard > steampunk-orchestrator > Settings > Environment Variables\n"
printf "\n"
printf "  After setting the env var, trigger a redeploy or wait for the next\n"
printf "  cron invocation. Jobs will start running through the central scheduler.\n"
printf "\n"
