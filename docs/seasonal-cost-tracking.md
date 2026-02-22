# Seasonal Cost Tracking — How It Works

> For Claude Code and human operators.
> Last updated: 2026-02-22

## The Problem

Steampunk Farms' biggest expense is hay (~$92K/year, 77.5% of all spending). Hay prices follow a predictable seasonal cycle tied to harvest timing in Southern California. A naive cost tracker that compares month-over-month would constantly cry wolf as prices climb through the depletion season (May–Sep), then celebrate false savings when harvest drops prices in October.

## The Hay Pricing Cycle

```
Price/bale
$16 ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
     │                                    ★ Sep: $15.84 (peak)
$15 ─│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─●─●─●─ ─ ─ ─ ─ ─ ─ ─ ─ ─
     │                              ●           
$14 ─│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─●─ ─ ─ ─ ─ ─ ─●─ ─ ─ ─ ─ ─ ─
     │                          ★ May: $14.97        ★ Oct: $13.90
$13 ─│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ●─ ─ ─ ─ ─
     │                                                    
$12 ─│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─●─●─ ─
     │  ★ Feb: $11.62  ★ Apr: $11.91                        
$11 ─●─●─●─●─●─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ●
     Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
     
     |←── post-harvest ──→|←── depletion ──→|←→|←── post ──→|
                                             new
                                           harvest
```

★ = actual observed 2025 prices from Elston's invoices

### Why It Happens

1. **Post-harvest (Oct–Feb):** Fall cuts flood warehouses. Supply high, demand unchanged. Prices bottom out around $11.50–$12.00/bale.

2. **Depletion (Mar–Sep):** Warehouses draw down last year's harvest. Supply shrinks month over month. Demand unchanged (animals still eat). Prices climb ~30% from trough to peak.

3. **New harvest (late Sep–Oct):** Fall cuts begin. Supply surges. Prices drop sharply. Customers don't shop for better deals — they stay with established relationships (which is why Elston's is a stable vendor).

4. **Straw (Oct–Dec only):** Not feed — winter bedding prep. Different product, different price sensitivity. Only purchased in Q4.

## The Solution: Seasonal Baselines

Instead of comparing this month to last month, we compare:

- **This month vs. this month's seasonal range** — is $15.50 in July normal? Yes, the baseline says $14.50–$16.00 for July.
- **This month vs. same month last year** — is July 2026's $15.50 > July 2025's $15.30? Yes, but only +1.3% which is within the 10% creep threshold.
- **Real cost creep** — September 2026 at $17.50 when September 2025 was $15.84 and the baseline says $15.00–$16.50 with a 10% threshold (cap $18.15)? Still within threshold, but **above_expected** so it gets flagged as a warning.

## Schema

### SeasonalBaseline

One row per vendor + item + month + year. Defines the expected price range.

| Field | Example | Purpose |
|-------|---------|---------|
| vendorId | (Elston's UUID) | Which supplier |
| item | `bermuda_hay` | What product |
| month | `9` | September |
| baselineYear | `2025` | What year this baseline was set from |
| expectedLow | `15.00` | Floor of normal range |
| expectedHigh | `16.50` | Ceiling of normal range |
| typicalPrice | `15.84` | What we actually observed |
| seasonPhase | `peak` | Human-readable phase name |
| creepThreshold | `0.10` | Flag if > expectedHigh × 1.10 |

### CostTracker

One row per invoice observation. Stores the price AND the comparison results.

| Field | Example | Purpose |
|-------|---------|---------|
| unitCost | `15.84` | What we paid per unit |
| previousCost | `15.55` | Last time we bought this |
| percentChange | `+1.86` | vs. last purchase |
| priorYearCost | `15.20` | Same month, prior year |
| yoyChange | `+4.21` | Year-over-year % |
| seasonalFlag | `expected` | Baseline comparison result |

### Seasonal Flags

| Flag | Meaning | Action |
|------|---------|--------|
| `expected` | Within seasonal range | None — normal |
| `below_expected` | Better than expected | Celebrate! Good deal |
| `above_expected` | Above range but within threshold | Monitor — worth noting |
| `cost_creep` | Above range + threshold | 🚨 Review with vendor |

## API Endpoints

### Record a price: `POST /api/cost-tracker/record`

Called by the Gmail scanner when it extracts a hay invoice from Elston's.

```json
{
  "vendorSlug": "elstons",
  "item": "bermuda_hay",
  "itemGroup": "hay",
  "unit": "bale",
  "quantity": 40,
  "unitCost": 12.15,
  "date": "2026-02-18",
  "invoiceRef": "elstons-2026-02-18"
}
```

Response includes the seasonal comparison:

```json
{
  "id": "...",
  "item": "bermuda_hay",
  "unitCost": 12.15,
  "seasonalFlag": "expected",
  "vsLastInvoice": { "previousCost": 11.62, "change": "+4.56%" },
  "vsLastYear": { "priorYearCost": 11.62, "change": "+4.56%" },
  "seasonal": {
    "phase": "post_harvest",
    "expectedRange": "$11.00–$12.25",
    "notes": "Observed 2025: $11.62/bale bermuda. Still post-harvest pricing."
  }
}
```

### Run cost-creep scan: `GET /api/cost-tracker/scan`

Returns a report across all tracked items.

```
GET /api/cost-tracker/scan                     — all items
GET /api/cost-tracker/scan?vendor=elstons      — single vendor
GET /api/cost-tracker/scan?group=hay           — all hay items
GET /api/cost-tracker/scan?flagged=true        — only flagged items
```

### View baselines: `GET /api/cost-tracker/baselines?vendor=elstons`

Returns the full 12-month seasonal curve for a vendor.

## For the Gmail Scanner

When the scanner finds an Elston's invoice, it should:

1. Extract the unit price per bale from the invoice
2. Call `POST /api/cost-tracker/record` with the data
3. Check the response's `seasonalFlag`
4. If `cost_creep` → log a prominent alert in the scan summary
5. If `above_expected` → note it in the summary as a watch item

Example in the scanner's output:

```
Elston's Hay & Grain:
  Invoice 2026-07-15: bermuda hay, 35 bales @ $16.10/bale
  ⚠️ Above expected range for depletion season ($14.50–$16.00)
  Year-over-year: +5.2% vs Jul 2025 ($15.30)
  Seasonal flag: above_expected
```

## Extending to Other Items

The system works for any item with seasonal or tracked pricing:

- **Star Milling grain:** Less seasonal than hay but still varies. Seed baselines after a year of data.
- **Propane:** Very seasonal (winter spikes). Add baselines for Oct–Mar.
- **Soap materials (COGS):** Coconut oil, lye, fragrance oils. Track for Cleanpunk margin protection.

To add a new tracked item:

1. Start recording prices via `/api/cost-tracker/record` (no baseline needed yet)
2. After 12 months of data, create baselines via `POST /api/cost-tracker/baselines`
3. The scanner will automatically compare against baselines going forward

## 2025 Baseline Data (Seeded)

| Month | Phase | Bermuda Hay | Straw |
|-------|-------|-------------|-------|
| Jan | post_harvest | $11.00–$12.00 | — |
| Feb | post_harvest | $11.00–$12.25 | — |
| Mar | post_harvest | $11.25–$12.50 | — |
| Apr | depletion | $11.50–$13.00 | — |
| May | depletion | $13.50–$15.50 | — |
| Jun | depletion | $14.00–$15.75 | — |
| Jul | depletion | $14.50–$16.00 | — |
| Aug | peak | $14.75–$16.25 | — |
| Sep | peak | $15.00–$16.50 | — |
| Oct | new_harvest | $12.50–$14.75 | $8.00–$12.00 |
| Nov | new_harvest | $11.50–$13.50 | $8.00–$12.00 |
| Dec | post_harvest | $11.25–$13.00 | $8.00–$12.00 |
