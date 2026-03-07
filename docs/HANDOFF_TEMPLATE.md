# Claude Code Handoff Template

Use this template for all Claude Code handoffs. CChat generates the handoff spec and CC execution prompt. Codex audits both before CC executes.

---

## Handoff Prompt (Copy-Paste)

```
You are working on the Steampunk Farms monorepo. Use the following files as your context:

- Unified brain: steampunk-strategy/CLAUDE.md
- Detailed handoff spec: docs/handoffs/[HANDOFF_SPEC].md
- Roadmap helper script: scripts/roadmap-updater.js
- Verification script: scripts/verify-handoff.mjs

Risk & Reversibility: [ONE_LINE_RISK_SUMMARY]

Objective: [ONE_LINE_DESCRIPTION]

Spec Sanity Pass (mandatory pre-edit step):
Before modifying any files, evaluate this handoff for architectural, brand/voice-ethos, protocol, and cross-site conflicts. If clean, proceed. If conflicts found, produce a Sanity Delta block before continuing.

Steps:
1. Read the handoff spec in docs/handoffs/[HANDOFF_SPEC].md completely. Understand all acceptance criteria.
2. [SPECIFIC_IMPLEMENTATION_STEPS - copied from the handoff spec, step by step]
3. Use verbose comments in new code linking back to relevant reference docs, e.g., `// see docs/postmaster-reference.md#section`
4. After completing all implementation steps, run: `node scripts/verify-handoff.mjs --handoff-name [HANDOFF_NAME]`
5. Run: `npx tsc --noEmit` in every modified repo and include output.
6. If verification passes, run: `node scripts/roadmap-updater.js "([HANDOFF_NAME]) [ORIGINAL_ROADMAP_ITEM_TEXT]" "[ONE_SENTENCE_SUMMARY_OF_WORK]"`
7. If verification fails, review the errors and fix them, then re-run steps 4-6.
8. Produce a structured debrief with: changed file list, file/line evidence, verification output, tsc output, any Sanity Deltas applied, deferred items.

Do not proceed to the next step until the current step is complete. If any acceptance criteria are not met, stop and ask for clarification.
```

---

## Template Variables

- **[HANDOFF_SPEC]**: filename from `docs/handoffs/` (e.g., `orchestrator-enhancement.md`)
- **[HANDOFF_NAME]**: short tag (e.g., `ORCH-101`)
- **[ONE_LINE_DESCRIPTION]**: what the handoff achieves
- **[ONE_LINE_RISK_SUMMARY]**: risk level and reversibility assessment
- **[SPECIFIC_IMPLEMENTATION_STEPS]**: from the "Files affected" and "Acceptance criteria" sections of the spec

---

## Example (ORCH-101)

```
You are working on the Steampunk Farms monorepo. Use the following files as your context:

- Unified brain: steampunk-strategy/CLAUDE.md
- Detailed handoff spec: docs/handoffs/orchestrator-enhancement.md
- Roadmap helper script: scripts/roadmap-updater.js
- Verification script: scripts/verify-handoff.mjs

Risk & Reversibility: Medium risk, fully reversible via git revert. Touches orchestrator only, no cross-site data flow changes.

Objective: Implement ORCH-101 — extend Orchestrator into a single schedule registry with locking, retry, dynamic frequency, and cross-site job definitions.

Spec Sanity Pass (mandatory pre-edit step):
Before modifying any files, evaluate this handoff for architectural, brand/voice-ethos, protocol, and cross-site conflicts. If clean, proceed. If conflicts found, produce a Sanity Delta block before continuing.

Steps:
1. Read docs/handoffs/orchestrator-enhancement.md completely.
2. Add Job, ExecutionLog, CronLock models to steampunk-orchestrator/prisma/schema.prisma and run `npx prisma db push`.
3. Create steampunk-orchestrator/src/lib/lock.ts with acquireLock() and releaseLock() functions.
4. Refactor steampunk-orchestrator/src/lib/cron-runner.ts to use locking and retry logic with exponential back-off.
5. Create steampunk-orchestrator/src/lib/internal-jobs.ts with the cross-site-report handler.
6. Create steampunk-orchestrator/src/app/api/admin/jobs/route.ts for GET/POST endpoints.
7. Register all 24 jobs in steampunk-orchestrator/src/lib/job-registry.ts.
8. Remove cron entries from vercel.json in each of: steampunk-studiolo, steampunk-postmaster, steampunk-rescuebarn, cleanpunk-shop.
9. Update *-reference.md files in each repo to note the central scheduler.
10. Use verbose comments in new code, e.g., `// see docs/orchestrator-reference.md#locking`
11. Run: `node scripts/verify-handoff.mjs --handoff-name ORCH-101`
12. Run: `npx tsc --noEmit` in steampunk-orchestrator and all modified repos.
13. If passed, run: `node scripts/roadmap-updater.js "(ORCH-101) Extend Orchestrator into single schedule registry" "Implemented central registry with locking, retries, removed site crons."`
14. If verification fails, fix errors and retry steps 11-13.
15. Produce structured debrief with evidence.
```

---

## Workflow

1. CChat (Claude Chat in Cline) builds the working spec, handoff spec, and CC execution prompt
2. Codex performs mandatory pre-flight audit of the handoff spec + CC prompt
3. Human pastes the audited CC prompt into Claude Code
4. Claude Code runs to completion, including verification, tsc, and roadmap update
5. Claude Code produces structured debrief
6. Codex performs mandatory post-flight audit of CC's debrief
7. GitHub Actions runs the same verification as a PR check (bonus safety net)
8. You review the PR comment and merge

---

## If Verification Fails

The script will tell you exactly what failed. Common issues:

- **File not found:** Mark as `(new)` or `(created)` in the handoff spec if it's supposed to be new.
- **Schema validation failed:** Run `npx prisma db push` to apply migrations.
- **TypeScript errors:** Check imports and types in the generated files.
- **Roadmap not updated:** Agent forgot to run the roadmap updater — ask it to do so.

If the agent can't fix it, ask in a follow-up: "The verification script found X. Please fix it by Y."
