# Deferred / Waiting on API Access

> Features that are fully designed and UI-ready but blocked on external API credentials.
> Every item has a mock provider built. When API access arrives, flip the feature flag.
> Created: 2026-03-14

---

## API Access Tracker

| # | Integration | What We Need | Who Provides It | Contact Path | Priority | Mock Status |
|---|---|---|---|---|---|---|
| 1 | **CRMLS/RESO Web API** | MLS data feed credentials | CRMLS via Starlene's MLS membership | Starlene applies through CRMLS member portal | P1 — Critical | Mock: 50 seeded listings |
| 2 | **Twilio Voice** | Twilio account + Voice API enabled | Twilio (self-serve signup) | Erick creates account, sets up phone number | P1 — Critical | Mock: tel: links + manual call log |
| 3 | **AppFolio API** | Partner API access or developer credentials | AppFolio — Erick's daughter is senior AI dev there | Erick asks daughter about API program | P2 — High | Mock: CSV import for PM data |
| 4 | **DocuSign** | Developer account + integration key | DocuSign Developer Portal (free sandbox available) | Self-serve signup | P2 — High | Mock: external DocuSign link |
| 5 | **QuickBooks Online** | OAuth app registration + Starlene's QBO login | Intuit Developer Portal | Self-serve signup + Starlene authorizes | P2 — High | Mock: manual financial entry |
| 6 | **Stripe** | Stripe account under GCR Inc. | Stripe (self-serve) | Starlene/Erick creates business account | P2 — High | Mock: payment links |
| 7 | **Square** | Square developer account | Square (self-serve) | Self-serve signup | P3 — Medium | Mock: payment links |
| 8 | **Matterport** | Account + embed API access | Matterport | Starlene may already have account | P3 — Medium | Mock: YouTube embeds |
| 9 | **TransUnion SmartMove** | API application (requires vetting) | TransUnion | Formal application process | P3 — Medium | Mock: external link |
| 10 | **Instagram API** | Meta Business account + Graph API app | Meta Developer Portal | Starlene's business IG account needed | P3 — Medium | Mock: copy-to-clipboard |
| 11 | **Facebook API** | Meta Page access + Graph API app | Meta Developer Portal | Same Meta app as Instagram | P3 — Medium | Mock: copy-to-clipboard |
| 12 | **LinkedIn API** | Marketing API access (approval required) | LinkedIn Developer Portal | Application + review process | P4 — Low | Mock: copy-to-clipboard |
| 13 | **X/Twitter API** | Developer account + API v2 access | X Developer Portal | Self-serve (paid tiers) | P4 — Low | Mock: copy-to-clipboard |
| 14 | **YouTube API** | YouTube Data API v3 key | Google Cloud Console | Self-serve | P4 — Low | Mock: copy-to-clipboard |
| 15 | **Supra** | API access (may not be publicly available) | Supra/UTC | Inquiry needed | P4 — Low | Mock: manual lockbox log |
| 16 | **ASANA** | API key for Red Hawk's workspace | Donn Bree / Red Hawk IT | Need permission from brokerage | P3 — Medium | Mock: CSV/email export |
| 17 | **ZOHO** | API key for Red Hawk's CRM | Donn Bree / Red Hawk IT | Need permission from brokerage | P3 — Medium | Mock: CSV export |

---

## Action Items for Erick

1. **Twilio:** Create account, purchase phone number for Starlene's area code (760). Enable Voice API. ~$1/month for number + per-minute usage.
2. **Stripe:** Create business account under Grapevine Canyon Ranch Inc. Connect bank account. Enable payment intents + webhooks.
3. **DocuSign:** Sign up for developer account. Create sandbox application. Get integration key + secret.
4. **Ask daughter about AppFolio:** Does AppFolio have a partner API program? Can she facilitate access or provide guidance on the application process?
5. **QuickBooks:** Register as developer on Intuit portal. Create OAuth app. Starlene will need to authorize the connection.

## Action Items for Starlene

1. **CRMLS API:** Apply for RESO Web API access through CRMLS member portal. May need broker approval from Donn.
2. **Instagram/Facebook:** Ensure business accounts are set up (not personal). Erick will handle Meta developer app creation.
3. **Matterport:** Does she already have an account? What tours exist? Share login or embed URLs.
4. **ASANA/ZOHO:** Ask Donn if Red Hawk will provide API access for automated compliance reporting. Pitch it as: "This automates the reporting you require from us."
5. **Square:** If she already has a Square account for PM payments, share access.

---

## Self-Serve API Signups (Erick Can Do Immediately)

These require no external approval — just time to set up:
- [ ] Twilio account + phone number
- [ ] Stripe business account
- [ ] DocuSign developer sandbox
- [ ] Square developer account
- [ ] Google Cloud Console (YouTube API key, already have for SSO)
- [ ] Meta Developer Portal (Instagram + Facebook Graph API app)

## Needs External Approval

These require someone else's action:
- [ ] CRMLS API (Starlene's MLS membership + possibly Donn's approval)
- [ ] AppFolio API (Erick's daughter / AppFolio partner program)
- [ ] ASANA/ZOHO API keys (Donn Bree / Red Hawk)
- [ ] TransUnion SmartMove (formal application + approval)
- [ ] LinkedIn Marketing API (application review process)
- [ ] Supra API (inquiry — may not exist publicly)
