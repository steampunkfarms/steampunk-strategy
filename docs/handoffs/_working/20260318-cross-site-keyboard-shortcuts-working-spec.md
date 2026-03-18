# Working Spec: Cross-Site Keyboard Shortcuts & Command Palette

**Handoff ID:** 20260318-cross-site-keyboard-shortcuts
**Tier:** 3 (Strategic — touches all 6 repos, novel pattern)
**Status:** Strategist mode — awaiting executor approval
**Date:** 2026-03-18

---

## Objective

Add a unified keyboard shortcut system across all 6 Steampunk Farms properties: global command palette, universal shortcuts, and site-specific bindings wired to existing features. Establishes a shared UX pattern for power-user navigation.

---

## Current State

| Repo | Hotkey Library | Existing Shortcuts | shadcn/ui | Theme Toggle |
|------|---------------|-------------------|-----------|-------------|
| Rescue Barn | None (vanilla `addEventListener`) | Cmd+K search modal only | 21 components | None |
| Studiolo | None | None | 5 components (mostly auth/nav) | Yes (theme-provider.tsx) |
| Postmaster | None | None | 0 (no ui/ folder) | None |
| TARDIS | None | None | 1 (auth-provider) | None |
| Orchestrator | None | None | 0 | None |
| Cleanpunk | None | None | Module-based (no central ui/) | Yes (theme-context.tsx) |

**Key file:** Rescue Barn's `src/components/search-modal.tsx` (214 lines) — vanilla Cmd+K with Fuse.js fuzzy search. This becomes the migration template.

---

## Architecture Decision: `react-hotkeys-hook`

**Why this library:**
- 4.3KB gzipped, zero dependencies
- Hook-based API (`useHotkeys`) fits React 19 patterns
- Handles Mac/Windows key normalization (Meta vs Ctrl)
- Scope management prevents shortcut conflicts between modals
- Active maintenance, 3.5K+ GitHub stars

**Alternative considered:** `cmdk` (command menu component) — heavier, opinionated UI. We already have shadcn Dialog + custom search patterns. `react-hotkeys-hook` gives us bindings without forcing a specific command palette UI.

**Pattern:**
```tsx
// Root layout wraps with HotkeysProvider
import { HotkeysProvider } from 'react-hotkeys-hook'

export default function RootLayout({ children }) {
  return (
    <HotkeysProvider>
      {children}
    </HotkeysProvider>
  )
}

// Individual shortcuts via useHotkeys hook
import { useHotkeys } from 'react-hotkeys-hook'

useHotkeys('mod+k', () => setCommandPaletteOpen(true))
useHotkeys('shift+/', () => setCheatsheetOpen(true))  // "?"
useHotkeys('escape', () => closeAllModals())
```

---

## Phase 1: Cross-Site Baseline (all 6 repos)

### 1A. Shared Infrastructure (per repo)

**Install:**
```bash
# npm repos (RB, Studiolo, Postmaster, TARDIS)
npm install react-hotkeys-hook

# pnpm repos (Orchestrator, Cleanpunk)
pnpm add react-hotkeys-hook
# Cleanpunk: install in apps/storefront/package.json
```

**Files to create per repo:**

| File | Purpose |
|------|---------|
| `components/ui/command-palette.tsx` | Cmd+K modal — search + action list |
| `components/ui/keyboard-cheatsheet.tsx` | Shift+? modal — lists all shortcuts |
| `components/ui/hotkeys-provider-wrapper.tsx` | Root wrapper with HotkeysProvider + universal bindings |
| `lib/shortcuts.ts` | Shortcut registry — keybinding → label → action mapping |

**Cleanpunk path variation:** `src/modules/common/components/` instead of `components/ui/`
**Orchestrator path variation:** `src/components/ui/` (already uses `src/` prefix)

### 1B. Universal Shortcuts (identical across all 6 sites)

| Shortcut | Action | Implementation |
|----------|--------|---------------|
| `Cmd+K` / `Ctrl+K` | Open command palette | `useHotkeys('mod+k', ...)` → toggle CommandPalette |
| `Shift+?` | Keyboard cheatsheet | `useHotkeys('shift+/', ...)` → toggle KeyboardCheatsheet |
| `Escape` | Close any modal/dropdown | `useHotkeys('escape', ...)` → close active overlay |
| `/` | Focus nearest search input | `useHotkeys('/', ...)` → `document.querySelector('[data-search]')?.focus()` |
| `Cmd+S` / `Ctrl+S` | Save current form | `useHotkeys('mod+s', ...)` → trigger nearest form submit |
| `J` / `K` | Next/prev in list views | `useHotkeys('j', ...) / useHotkeys('k', ...)` — skip when input focused |
| `Space` | Expand/collapse accordion | `useHotkeys('space', ...)` — only when focused on expandable element |

**J/K and Space guards:** These must be disabled when focus is inside an `<input>`, `<textarea>`, or `[contenteditable]`. `react-hotkeys-hook` supports this via `enableOnFormTags: false` (default).

### 1C. Rescue Barn Migration

The existing `search-modal.tsx` vanilla `addEventListener` pattern must be migrated to `react-hotkeys-hook` to avoid duplicate Cmd+K listeners. Steps:

1. Remove the `useEffect` keydown listener from `search-modal.tsx`
2. Wire the open trigger through the new `hotkeys-provider-wrapper.tsx`
3. Keep the Fuse.js search logic and modal UI — only change the trigger mechanism

### 1D. shadcn Bootstrapping

Repos that lack Dialog need it for the command palette and cheatsheet modals:

| Repo | Needs | Approach |
|------|-------|---------|
| Postmaster | Dialog, VisuallyHidden | Install @radix-ui/react-dialog + minimal styling |
| Orchestrator | Dialog, VisuallyHidden | Same |
| TARDIS | Dialog already usable via auth-provider pattern | Verify; add if missing |
| Studiolo | Has sidebar/nav components | Verify Dialog availability |
| Cleanpunk | Module-based; may have Dialog in checkout | Verify; add to `src/modules/common/` if missing |
| Rescue Barn | Full shadcn set | No action needed |

### 1E. Visual Polish (optional, can defer)

| Element | Description | Cost |
|---------|------------|------|
| Brass click sound | `<audio>` element, ~2KB WAV, user-muted by default | Low |
| Steam-gauge needle on palette open | CSS transform animation on palette icon | Low |
| Glow ring on focused field | `focus-visible` ring with `tardis-glow` / `brass-gold` color | Low |
| Fade + "steam release" on modal close | CSS `@keyframes` opacity + scale | Low |
| Scrollable table old-ledger styling | CSS class `ledger-table` with parchment bg + ruled lines | Low |

**Recommendation:** Defer visual polish to a follow-up. Ship functional shortcuts first.

---

## Phase 2: Site-Specific Shortcuts (Existing Features Only)

Only shortcuts that wire to features with existing pages, components, or API routes. Each shortcut is a `useHotkeys` call that either navigates to a route or triggers an existing action.

### Rescue Barn

| Shortcut | Action | Wires To | Type |
|----------|--------|---------|------|
| `Cmd+Enter` | Publish Cogworks post | `PostEditor.tsx` submit handler (publish status) | Action trigger |
| `G then B` | Jump to Barn Feed | `/barn-feed` route | Navigation |
| `G then A` | Jump to Academy | `/academy` route | Navigation |

**Deferred:** `Cmd+Shift+L` gas-lamp mode — no theme provider exists in Rescue Barn. Requires new UI.

### Studiolo

| Shortcut | Action | Wires To | Type |
|----------|--------|---------|------|
| `Cmd+Shift+D` | Donor search page | `/donors` route (has search built in) | Navigation |
| `Cmd+Shift+T` | Touch queue | `/touches` route | Navigation |
| `Cmd+Shift+R` | Receipt queue (Atelier) | `/atelier/queue` route | Navigation |
| `G then O` | Org directory | `/orgs` route | Navigation |

**Deferred:**
- `Cmd+Shift+F` friction-scan dashboard — friction alerts API exists but no standalone dashboard page. Navigating to stewardship page is possible but not the intended UX.
- `G then C` campaign list — no `/campaigns` page exists (only cron jobs).

### Postmaster

| Shortcut | Action | Wires To | Type |
|----------|--------|---------|------|
| `Cmd+Enter` | Post now (rendition) | `/api/renditions/post-now` — trigger from queue page context | Action trigger |
| `Cmd+Shift+M` | Media presets | `/media/presets` route | Navigation |
| `Cmd+Shift+R` | Regenerate current fragment | `/api/generate/*/regenerate` routes — context-dependent | Action trigger |
| `G then I` | Inputs list | `/inputs` route | Navigation |
| `G then Q` | Review queue | `/queue` route | Navigation |

**Deferred:**
- `Cmd+Shift+S` storm preview — no preview component exists. Storm generation is available but not as a standalone preview action.

### Cleanpunk Shop

| Shortcut | Action | Wires To | Type |
|----------|--------|---------|------|
| `Cmd+Shift+C` | Open cart | Cart summary template (navigate to cart page) | Navigation |
| `Cmd+Shift+P` | Product search (admin) | `/admin` inventory manager with search | Navigation |
| `Cmd+Shift+G` | Growth ideas | `/admin/growth/ideas` route | Navigation |
| `Cmd+Enter` | Submit checkout | Checkout page payment submission | Action trigger |

**Deferred:**
- `Cmd+Shift+B` bulk enhance — only individual product enhance exists (`/admin/products/enhance/[id]`). Bulk selection UI does not exist.

### TARDIS (The Bridge)

| Shortcut | Action | Wires To | Type |
|----------|--------|---------|------|
| `Cmd+Shift+U` | Upload receipt | `document-uploader.tsx` modal trigger | Action trigger |
| `Cmd+Shift+P` | Print board minutes PDF | `/api/board-minutes/[id]/pdf` route | Action trigger |
| `G then E` | Expenses ledger | `/expenses` route | Navigation |
| `Cmd+Shift+I` | Intelligence dashboard | `/intelligence` route | Navigation |

**Deferred:**
- `Cmd+Shift+R` Gmail receipt scan on demand — only cron-based scan exists, no manual trigger endpoint.
- `G then C` compliance hub — no unified `/compliance` page exists.

### Orchestrator

| Shortcut | Action | Wires To | Type |
|----------|--------|---------|------|
| `Cmd+Shift+R` | Refresh cron stats | `/api/cron-stats` route (fetch + re-render) | Action trigger |
| `G then A` | Dashboard (all jobs) | `/dashboard` route | Navigation |

**Deferred:**
- `Cmd+Shift+J` fuzzy job search — no standalone job search UI. Dashboard shows jobs but no fuzzy picker.
- `Cmd+Shift+D` deploy-event timeline — deploy events are tracked but no dedicated timeline view.
- `G then L` execution log — logs are on dashboard but no standalone page.

---

## Phase 3: Easter Eggs (Low Priority, Ship Anytime)

| Easter Egg | Scope | Effort |
|-----------|-------|--------|
| Konami code → Captain's Log panel | All admin pages — show random CaptainsLog entry with typewriter animation | ~2 hours |
| Hold Cmd 3s → gauge steam particles | CSS-only particle effect on `.gauge-*` elements | ~1 hour |
| Type "storm" in Postmaster queue → auto-select next un-reviewed | Queue page keydown listener | ~30 min |

**Recommendation:** Ship these as fun follow-ups after Phases 1+2 are stable.

---

## Implementation Sequence

| Order | Repo | Why This Order | Est. Files |
|-------|------|---------------|------------|
| 1 | Rescue Barn | Has existing Cmd+K to migrate, fullest shadcn set, proves the pattern | 5 new, 2 modified |
| 2 | TARDIS | We're already here, iterate on pattern | 5 new, 1 modified |
| 3 | Studiolo | Similar internal-tool pattern to TARDIS | 5 new, 1 modified |
| 4 | Postmaster | Needs shadcn bootstrapping, similar to Studiolo | 6 new, 1 modified |
| 5 | Cleanpunk | Turborepo adds complexity, pattern is stable by now | 5 new, 1 modified |
| 6 | Orchestrator | Smallest scope, least user-facing | 6 new, 1 modified |

**Total estimated:** ~32 new files, ~7 modified files across 6 repos

---

## "G then X" Navigation Pattern

Gmail-style two-key navigation requires a timeout-based sequence detector:

```tsx
// lib/shortcuts.ts — shared across all repos
const G_SHORTCUTS: Record<string, string> = {
  'b': '/barn-feed',      // Rescue Barn
  'a': '/academy',        // Rescue Barn
  'e': '/expenses',       // TARDIS
  // etc — site-specific
}

let gPressed = false
let gTimeout: ReturnType<typeof setTimeout>

useHotkeys('g', () => {
  gPressed = true
  gTimeout = setTimeout(() => { gPressed = false }, 1000)
}, { enableOnFormTags: false })

// Then each second key:
useHotkeys('b', () => {
  if (gPressed) { router.push(G_SHORTCUTS['b']); gPressed = false; clearTimeout(gTimeout) }
}, { enableOnFormTags: false })
```

Alternative: `react-hotkeys-hook` supports key sequences natively if version ≥4.x. Verify version compatibility before choosing approach.

---

## Risk & Reversibility

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| Shortcut conflicts with browser defaults | Medium | All site-specific use `Cmd+Shift+X` which is safe; test Cmd+S override per browser |
| J/K triggers while typing in forms | Low | `enableOnFormTags: false` is the default; add `data-hotkeys-ignore` to editors |
| Cmd+Enter conflicts with textarea newline | Medium | Only bind on specific pages (queue, editor) not globally |
| Performance: 20+ useHotkeys hooks per page | Low | Library is lightweight; hooks are no-ops when not triggered |
| Rescue Barn Cmd+K migration breaks search | Medium | Test thoroughly; keep Fuse.js logic intact, only change trigger |
| 6-repo rollout = 6 Vercel deploys | Low | Deploy sequentially, verify each before next |

**Reversibility:** High — all changes are additive (new files, new hooks). Rollback = remove the provider wrapper + delete new files. No schema changes, no data migrations.

---

## Deferred Items (→ roadmap.md)

These shortcuts require **new UI or features** that don't exist yet:

| ID | Item | Repo | Blocker |
|----|------|------|---------|
| KB-D1 | Gas-lamp mode toggle (`Cmd+Shift+L`) | Rescue Barn | No theme provider — needs ThemeProvider + dark palette |
| KB-D2 | Friction-scan dashboard shortcut | Studiolo | No `/friction` page — friction alerts exist as API only |
| KB-D3 | Campaign list navigation (`G then C`) | Studiolo | No `/campaigns` page exists |
| KB-D4 | Storm preview shortcut (`Cmd+Shift+S`) | Postmaster | No storm preview component |
| KB-D5 | Bulk enhance shortcut (`Cmd+Shift+B`) | Cleanpunk | Only individual enhance exists |
| KB-D6 | Gmail receipt manual scan (`Cmd+Shift+R`) | TARDIS | No manual trigger endpoint |
| KB-D7 | Compliance hub navigation (`G then C`) | TARDIS | No unified `/compliance` page |
| KB-D8 | Fuzzy job search (`Cmd+Shift+J`) | Orchestrator | No search UI |
| KB-D9 | Deploy timeline (`Cmd+Shift+D`) | Orchestrator | No timeline view |
| KB-D10 | Execution log page (`G then L`) | Orchestrator | Logs on dashboard, no standalone page |
| KB-D11 | Donor search overlay (as modal, not page nav) | Studiolo | Current shortcut navigates to `/donors`; overlay is new UI |

---

## Acceptance Criteria

### Phase 1 (Baseline)
- [ ] `react-hotkeys-hook` installed in all 6 repos
- [ ] `<HotkeysProvider>` wraps root layout in all 6 repos
- [ ] Command palette (Cmd+K) opens and closes in all 6 repos
- [ ] Keyboard cheatsheet (Shift+?) lists all available shortcuts per site
- [ ] Escape closes all modals/dropdowns in all 6 repos
- [ ] `/` focuses search input (where search exists)
- [ ] J/K navigates list items on table/list pages (does not fire in form inputs)
- [ ] Cmd+S saves forms (where applicable)
- [ ] Rescue Barn's existing Cmd+K search migrated from vanilla to react-hotkeys-hook
- [ ] No shortcut fires inside text inputs, textareas, or contenteditable unless intentional
- [ ] `npx tsc --noEmit` passes in all 6 repos

### Phase 2 (Site-Specific)
- [ ] All non-deferred shortcuts from Phase 2 tables are wired and functional
- [ ] "G then X" two-key navigation works with 1-second timeout
- [ ] Action shortcuts (Cmd+Enter, Cmd+Shift+R, etc.) trigger the correct existing handler
- [ ] Navigation shortcuts route to the correct page
- [ ] Cheatsheet modal updated with all site-specific shortcuts

---

## Cross-Site Impact Checklist

- [ ] **Auth:** No impact — shortcuts are client-side only, no auth changes
- [ ] **Database:** No impact — no schema changes, no migrations
- [ ] **API routes:** No new routes — all shortcuts wire to existing endpoints
- [ ] **Shared packages:** None — each repo gets its own `react-hotkeys-hook` install
- [ ] **Vercel config:** No changes — no new env vars, no cron changes
- [ ] **Voice/AI:** No impact — no prompt changes
- [ ] **Accessibility:** Shortcuts must not break screen reader navigation; all modals need proper ARIA roles and focus trapping (shadcn Dialog handles this)
