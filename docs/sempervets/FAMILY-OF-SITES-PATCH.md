# Family of Sites — Site #7 Registration Patch

> Apply these changes when the repo + Vercel project are created.
> Created: 2026-03-14

---

## 1. Add to Properties Table in FAMILY_OF_SITES_UPDATED.md

Add this row after line 6 (Orchestrator):

```
| 7 | **Semper Vets** | (TBD on project creation) | sempervets.com / semper.tronboll.us | sempervets |
```

## 2. Update Stack Note

Change:
```
All repos under `github.com/steampunkfarms/`. Sites 1–4: Next.js 16.1.6 + React 19.2.4. TARDIS: Next.js 15.5.12 + React 19.2.4 (upgrade pending handoff 001). Orchestrator: Next.js (thin scheduler).
```

To:
```
All repos under `github.com/steampunkfarms/`. Sites 1–4, 7: Next.js 16 + React 19. TARDIS: Next.js 15.5.12 + React 19.2.4 (upgrade pending handoff 001). Orchestrator: Next.js (thin scheduler).
```

## 3. Add to Filesystem Reference

```
├── sempervets-reference.md        # Stack, schema, routes, APIs, patterns (Site #7)
├── sempervets/                    # Full planning docs (master plan, schema, checkpoints)
```

## 4. Add to Domains Table

```
| `sempervets.com` | Semper Vets Command Center (Vercel) |
| `semper.tronboll.us` | Semper Vets staging (Vercel) |
```

## 5. Add to External Services Table

```
| Resend | Semper Vets | MX routing + transactional + campaigns |
| Twilio | Semper Vets | SMS + VoIP (when enabled) |
| Daily.co | Semper Vets | Virtual showing video rooms |
| Stripe | Semper Vets | PM payments + invoicing |
| DocuSign | Semper Vets | E-signatures (when enabled) |
| Neon PostgreSQL | Semper Vets | Dedicated database (sempervets-db) |
```

## 6. Add to Cron Summary (When Built)

```
| Semper Vets | TBD | MLS sync (daily), Market Sentinel (weekly), Drip engine (hourly), Predictive maintenance (daily), Engagement scoring (daily) |
```

## 7. Notes for family-of-sites-full.md

The exhaustive version should include:
- Full client context (Starlene/Ashlyn/Red Hawk structure)
- Commission math rules (25-50% GCI vs 100% RHRPM)
- PM decoupling architecture
- Integration provider matrix (mock vs real)
- Reference to `sempervets-reference.md` for deep details
