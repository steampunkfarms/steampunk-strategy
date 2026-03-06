# Cross-Site Impact Checklist (Mandatory for Every Working Spec)

Add this section to every `_working-spec.md` before generating the Codex prompt.

**Repos touched:**  
- [ ] Rescue Barn  
- [ ] Studiolo  
- [ ] Postmaster  
- [ ] Cleanpunk Shop  
- [ ] TARDIS  
- [ ] Orchestrator  

**Authentication implications:**  
[Azure AD / Supabase / INTERNAL_SECRET changes?]

**Data-flow consequences:**  
[Postmaster → Rescue Barn API? Studiolo webhook? Cron impact?]

**Orchestrator / Cron impact:**  
[New job needed? Schedule change?]

**Verification commands required:**  
- `node scripts/verify-handoff.mjs --handoff-name <ID>`  
- [Additional site-specific checks]

If any box is checked, escalate to Mapped Mode automatically.