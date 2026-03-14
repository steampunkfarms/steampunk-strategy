// postest
// Cross-Site API Contract Types — Strategy/TARDIS served + consumed APIs
// Canonical source: steampunk-strategy/docs/contracts/cross-site-types.ts
// Drift check: npx tsx scripts/check-type-drift.ts (run from steampunk-strategy)
// Updated: 2026-03-13

// Served: GET /api/impact, GET /api/impact/[slug]
export interface ProgramImpact {
  program: {
    id: string
    name: string
    slug: string
    description: string | null
    species: string[]
  }
  period: {
    label: string
    start: string
    end: string
  }
  summary: {
    totalSpend: number
    transactionCount: number
  }
  breakdown: {
    byCategory: Array<{ name: string; amount: number; count: number }>
    byVendor: Array<{ name: string; amount: number; count: number }>
  }
  species: {
    list: string[]
    productMappings: Array<{ product: string; species: string[]; notes: string | null }>
  }
  costTracker: Array<{
    item: string
    itemGroup: string | null
    vendorName: string
    avgUnitCost: number
    totalQuantity: number
    unit: string
    entries: number
  }>
  recentTransactions?: Array<{
    id: string
    date: string
    description: string
    amount: number
    vendor: string | null
    category: string | null
  }>
  donorAttribution?: {
    donorId: string
    poolTotal: number
    donorGiving: number
    attributedAmount: number
  } | null
}

export interface AllProgramsResponse {
  period: { label: string; start: string; end: string }
  programs: ProgramImpact[]
  totals: {
    totalSpend: number
    totalTransactions: number
    programCount: number
  }
}

// Consumed from Studiolo: GET /api/internal/bi-metrics
export interface StudioloBIMetrics {
  donors: {
    total: number
    active: number
    lapsed: number
    retentionRate: number
    bySegment: Record<string, number>
  }
  giving: {
    totalLifetime: number
    totalGifts: number
    avgGift: number
    last12Months: number
    giftsLast12Months: number
    monthlyRecurring: number
    annualRecurringProjection: number
  }
  monthlyTrend: Array<{ month: string; total: number; count: number }>
  channelBreakdown: Array<{ channel: string; total: number; count: number }>
  generatedAt: string
}

// Consumed from Cleanpunk: GET /api/internal/bi-metrics
export interface CleanpunkBIMetrics {
  orders: {
    totalAllTime: number
    totalYTD: number
    totalPriorYear: number
    countYTD: number
    avgOrderValue: number
  }
  revenue: {
    grossYTD: number
    grossPriorYear: number
    yoyChangePct: number
    byMonth: Array<{ month: string; gross: number; orderCount: number }>
    byCollection: Array<{ collection: string; revenue: number; units: number }>
  }
  customers: {
    total: number
    newYTD: number
    repeatPurchasers: number
  }
  products: {
    totalActive: number
    lowStock: Array<{ name: string; variant: string; inventory: number }>
    topSellers: Array<{ name: string; units: number; revenue: number }>
  }
  fetchedAt: string
}

// Consumed from Postmaster: GET /api/internal/bi-metrics
export interface PostmasterBIMetrics {
  temperature: {
    totalContacts: number
    avgScore: number
    distribution: { hot: number; warm: number; cool: number; cold: number; unknown: number }
  }
  engagement: {
    last30Days: number
    byPlatform: Record<string, number>
    bySignalTier: Record<string, number>
  }
  donorCorrelation: Array<{
    studioloId: string
    temperatureScore: number | null
    temperatureLabel: string | null
    totalComments: number | null
    totalReactions: number | null
    totalMessages: number | null
    donorTier: string | null
  }>
  generatedAt: string
}
