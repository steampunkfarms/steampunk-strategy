# Payment Card & Purchase Classification Rules

## Amazon

Amazon orders come to the farm Gmail but mix personal and farm purchases.

### Cards:
- **Card ending 9785** = Frederick's personal card
- **Card ending 9932** = Farm bank account card

### How to tell them apart:
- **9785 only (no gift card)** → PERSONAL. Skip during import.
- **Gift card + remainder on 9785** → FARM. Gift cards bought with personal money via RaiseRight. The 1.5% rebate goes to the farm.
- **Gift card + remainder on 9932** → FARM. Gift cards bought by farm, remainder on farm bank card.
- **Gift card only** → FARM. Gift cards bought by farm.
- **9932 only** → FARM. Direct farm bank account purchase.

### Scanner logic:
The only skip condition: payment shows **only** "card ending in 9785" with **no** gift card balance.
Everything else is a farm expense — import it.

## Lowe's & Home Depot

- Receipts go to Frederick's **personal email**, not the farm Gmail.
- Purchases at these stores are made with **RaiseRight gift cards** (4% rebate).
- Frederick buys the gift cards with personal money; the rebate goes to the farm.
- These are farm expenses: shelter building supplies, program services supplies.
- These will NOT be caught by the Gmail scanner — they need to come in via:
  - Manual import, or
  - RaiseRight reporting integration (future), or
  - Forwarding receipts to the farm Gmail

## RaiseRight Rebate Tracking

| Store | Rebate % | Use Case |
|-------|----------|----------|
| Amazon | 1.5% | General farm supplies, animal care, feed accessories |
| Lowe's | 4.0% | Shelter building supplies, fencing, tools |
| Home Depot | 4.0% | Shelter building supplies, maintenance materials |

The rebate income should be tracked as revenue (source: "raiseright_rebate") when
the quarterly RaiseRight payout arrives.
