Before doing anything else, read `steampunk-strategy/docs/CODEX.md` and enforce the Codex -> Claude Code handoff protocol exactly: do not implement code yourself, generate one paste-ready Claude Code prompt only, require that Claude Code reads the active handoff spec first, keep scope strictly to that spec, include ordered implementation steps plus acceptance criteria, include verification and roadmap-update commands, and if the handoff spec path is missing or verification fails, stop and report/fix before marking completion. For scoped implementation work, enforce the default method automatically: capture discovery/findings in `docs/handoffs/_working/<handoff-id>-working-spec.md`, refine plan iteratively in that same file, then generate a fully execution-mapped handoff spec with exact insertion anchors, exact final text blocks, and a strict acceptance checklist; if `<handoff-id>` is not provided, generate it automatically (date + short slug, preferred format `YYYYMMDD-short-slug`) without asking the human to name files or paths.

New requirements (2026-03-06):
- Always include the Strategy Session Template answers and Cross-Site Checklist in the working spec.
- Require a one-line "Risk & Reversibility" summary at the top of every Claude Code prompt.
- If the handoff touches GenAI content workflows, require the no-link/no-CTA insertion audit across prompt layers, generation routes, preview/regenerate routes, and post-processing helpers (including closings and URL-tagging), with file paths + line anchors and fail-until-fixed behavior.
- Use the Debrief Script after verification passes.
- Enforce Family Planning Protocol gating before any Major Initiative handoff.

Spec Sanity Pass and Bounded Deviation (2026-03-06b):
- Every Claude Code prompt must include a mandatory pre-edit Spec Sanity Pass: Claude evaluates the handoff for architectural, brand/voice-ethos, protocol, and cross-site conflicts before any file modifications.
- If no conflicts: proceed with mapped execution as written.
- If conflicts: Claude emits a Sanity Delta block (conflict summary, impacted files/anchors, minimal correction, risk if unchanged, updated acceptance criteria).
- Bounded Deviation rule: Claude may deviate from mapped instructions only when evidence is file-specific and reproducible, change is minimal and strictly risk-reducing, and deviation is labeled "Sanity Delta Applied" in wrap-up.
- If deviation materially changes scope, Claude must stop and request human confirmation.

Also enforce mode selection and preflight behavior: use Mapped Mode for high-risk/GenAI/protocol work, allow Lean Mode only for simple low-risk scoped tasks, require Lean->Mapped escalation when ambiguity/scope/risk increases, and if canonical handoff files are missing but complete inline execution details are present, create canonical working/handoff spec files first and then execute.
Environment constraints (2026-03-06, apply to ALL generated Claude Code prompts):
- All Next.js repos are on 16.x. `next lint` was removed in Next.js 16. Use `eslint` or `npx eslint .` for linting, never `next lint`.
- Every verification block MUST include `npx tsc --noEmit` for each modified repo. Do not claim PASS without zero-error tsc output.
- Cross-repo CI workflows in GitHub Actions require explicit checkout of sibling repos — flag this in Sanity Pass if the workflow needs files from repos other than the hosting repo.
- ESLint configs per repo: strategy (eslint.config.mjs), postmaster (eslint.config.mjs), rescuebarn (eslint.config.mjs), studiolo (.eslintrc.json), orchestrator (none — create if needed), cleanpunk (none — Turbo monorepo).
- Auth stacks: Postmaster + Studiolo use NextAuth (lib/auth.ts). Rescue Barn uses Supabase auth (src/proxy.ts + src/app/auth/callback/route.ts). Cleanpunk uses Medusa built-in auth. Flag stack mismatches in Sanity Pass when generating auth-related prompts.
- `.github/copilot-instructions.md` is tracked in steampunk-strategy repo (not a standalone parent repo).
- Before marking any implementation complete, Claude MUST run `npx tsc --noEmit` in every modified repo and include the output in the Claim->Evidence table.