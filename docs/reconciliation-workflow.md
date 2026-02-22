# Annual Personal/Farm Reconciliation — How It Works

> For Claude Code and Frederick.
> Last updated: 2026-02-22

## The Problem

Steampunk Farms runs on shared purchasing accounts. The farm Amazon, Chewy,
and Tractor Supply accounts are also where Fred and Krystal sometimes order
personal items. And vice versa — an emergency farm order might go on Fred's
personal card because it's in his pocket at TSC.

This is normal and fine. What matters is that once a year, everything gets
sorted so the books are clean.

## The Rule

At the end of each fiscal year (January), every purchase on a shared account
gets reviewed. The two directions:

| Direction | What happened | Who's owed |
|-----------|--------------|------------|
| **personal_on_farm** | Personal item bought on farm account | Farm is owed |
| **farm_on_personal** | Farm item bought on personal account | Fred is owed |

At the end, you net them out:
- If Fred owes the farm → Fred makes a donation via Zeffy (tax-deductible)
- If farm owes Fred → Fred chooses: get reimbursed, OR donate the balance back (also tax-deductible)
- In practice, Fred usually pads the donation a little for safety

## The January Workflow

### 1. Open a session (January 1–5)

```
POST /api/reconciliation/sessions
{ "fiscalYear": 2025 }
```

This creates a reconciliation session for FY2025 and auto-pulls any
transactions that were flagged as commingled during the year.

### 2. Run the Gmail scanner (if not already done)

The scanner detects suspected commingled items and adds them to the queue
automatically. See GMAIL_SCANNING_INSTRUCTIONS.md, Step 7.

### 3. Add manual items

Some commingled purchases won't be in email (in-store TSC runs, cash
purchases, etc.). Add them manually:

```
POST /api/reconciliation/items
{
  "fiscalYear": 2025,
  "items": [
    {
      "date": "2025-03-15",
      "amount": 47.33,
      "description": "TSC — personal garden supplies on farm card",
      "vendor": "Tractor Supply",
      "direction": "personal_on_farm",
      "account": "farm-card",
      "source": "manual"
    },
    {
      "date": "2025-07-22",
      "amount": 89.95,
      "description": "Amazon — emergency pee pads on personal card",
      "vendor": "Amazon",
      "direction": "farm_on_personal",
      "account": "personal-card-fred",
      "source": "manual"
    }
  ]
}
```

### 4. Review the queue

View the full session with all items and live tallies:

```
GET /api/reconciliation/sessions/2025
```

Returns:
- All items with their current status
- Progress (pending/resolved/total)
- Running tallies of personal-on-farm vs farm-on-personal
- Net balance and who owes whom

### 5. Resolve each item

For each item in the queue, mark it as farm or personal:

```
PUT /api/reconciliation/items/{id}
{ "status": "farm", "note": "Actually farm — tablet for barn webcam display" }
```

```
PUT /api/reconciliation/items/{id}
{ "status": "personal", "note": "Birthday gift, not farm" }
```

For mixed orders where one receipt had both farm and personal items:

```
PUT /api/reconciliation/items/{id}
{
  "status": "split",
  "farmPortion": 34.99,
  "personalPortion": 12.99,
  "note": "Pee pads were farm, phone case was personal"
}
```

Or skip items that you can't figure out or that were already handled:

```
PUT /api/reconciliation/items/{id}
{ "status": "skipped", "note": "Already settled separately" }
```

### 6. Check the tallies

As you resolve items, the tallies update in real-time. Call the session
endpoint again to see where you stand:

```json
{
  "tallies": {
    "personalOnFarm": 423.17,
    "farmOnPersonal": 189.95,
    "netBalance": 233.22,
    "netDirection": "founder_owes_farm",
    "summary": "Fred owes the farm $233.22"
  },
  "progress": {
    "total": 14,
    "pending": 0,
    "resolved": 12,
    "skipped": 2,
    "percentComplete": 86
  }
}
```

### 7. Settle

Once all items are resolved (none pending), settle the session:

**If Fred owes the farm:**
```
POST /api/reconciliation/settle
{
  "fiscalYear": 2025,
  "resolution": "donation_to_farm",
  "settlementAmount": 250.00,
  "settlementMethod": "zeffy",
  "settlementRef": "zeffy-donation-abc123",
  "note": "Rounded $233.22 up to $250 as additional donation"
}
```

**If farm owes Fred and he donates it back:**
```
POST /api/reconciliation/settle
{
  "fiscalYear": 2025,
  "resolution": "donation_from_founder",
  "settlementAmount": 189.95,
  "settlementMethod": "internal",
  "note": "Waived reimbursement — donated balance back to org"
}
```

**If farm owes Fred and he wants reimbursement:**
```
POST /api/reconciliation/settle
{
  "fiscalYear": 2025,
  "resolution": "reimbursement_to_founder",
  "settlementAmount": 189.95,
  "settlementMethod": "check",
  "settlementRef": "check-1234"
}
```

### 8. What settlement creates

The settle endpoint automatically creates a Transaction in the ledger:

- **donation_to_farm** → Income transaction, tax-deductible, coded as
  "Part VIII, Line 1 (contributions)"
- **donation_from_founder** → Same as above
- **reimbursement_to_founder** → Expense transaction, coded to admin

This means the 990 reflects it correctly and Fred gets credit for the donation.

## The "Pad" Feature

Fred mentioned he likes to "pad it a little for safety." The system supports
this natively. If the net balance is $233.22 and Fred donates $250.00:

- `settlementAmount`: $250.00
- `padAmount`: $16.78 (auto-calculated)
- The full $250 is recorded as a donation
- The pad is documented in the settlement note

## Purchasing Account Registry

The system tracks which accounts belong to whom:

| Account | Owner | Platform |
|---------|-------|----------|
| Farm Amazon | farm | amazon |
| Personal Amazon (Fred) | personal_fred | amazon |
| Farm Chewy | farm | chewy |
| Personal Chewy | personal_fred | chewy |
| Farm TSC | farm | tractor_supply |
| Farm Debit/Credit Card | farm | card |
| RaiseRight Card | farm | card |
| Personal Card (Fred) | personal_fred | card |

The Gmail scanner uses this to automatically flag cross-account purchases.
Manage accounts at `GET/POST /api/reconciliation/accounts`.

## Compliance Integration

A compliance task is seeded: "Annual Personal/Farm Account Reconciliation"
- **Authority:** Internal
- **Due:** January 31
- **Reminder:** 14 days before
- **Depends on:** Gmail scan complete

This shows up in the compliance dashboard alongside the business license
renewal. Both are January tasks — do the reconciliation first since it
affects the books, then the license renewal.

## Timeline

```
Jan 1-5:     Open reconciliation session for prior fiscal year
Jan 1-15:    Run Gmail scanner (or verify it ran), add manual items
Jan 15-25:   Review queue — mark each item farm or personal
Jan 25-31:   Settle — make donation via Zeffy or choose reimbursement
Feb-May:     Reconciled books are ready for 990 prep
```

## What This Solves for the IRS

Commingled accounts are a compliance concern for nonprofits. This system
creates a documented annual process with:

1. **Every suspected item logged** with date, amount, vendor, and direction
2. **Clear resolution** for each item with timestamps and notes
3. **Net calculation** showing exactly what was owed in each direction
4. **Settlement documentation** — donation receipt from Zeffy or check record
5. **Audit trail** — the ReconciliationSession record persists forever

If an auditor asks "did the founder use farm accounts for personal purchases?"
the answer is: "Yes, occasionally, and here's the annual reconciliation
showing every instance, how it was resolved, and the donation that covered it."
