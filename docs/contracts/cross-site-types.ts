// postest
// Cross-Site API Contract Types — Canonical Source of Truth
// see docs/handoffs/20260313-cross-site-type-drift.md
//
// These interfaces define the exact shapes returned by internal API endpoints
// across the Steampunk Farms family of sites. Each consuming repo should maintain
// a copy in lib/internal-contracts.ts. The drift-check script validates structural
// alignment between this file and the per-repo copies.
//
// Updated: 2026-03-13

// ─────────────────────────────────────────────────────
// TARDIS Impact API (steampunk-strategy)
// GET /api/impact — batch (all programs)
// GET /api/impact/[slug] — single program
// ─────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────
// Studiolo BI Metrics (steampunk-studiolo)
// GET /api/internal/bi-metrics
// ─────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────
// Studiolo Donor Lookup (steampunk-studiolo)
// GET /api/internal/donors/lookup?email=...
// ─────────────────────────────────────────────────────

export interface DonorLookupFound {
  found: true
  donor: {
    donorId: string
    firstName: string | null
    lastName: string | null
    segment: string | null
    lane: string
  }
}

export interface DonorLookupNotFound {
  found: false
}

export type DonorLookupResponse = DonorLookupFound | DonorLookupNotFound

// ─────────────────────────────────────────────────────
// Studiolo Log Touch (steampunk-studiolo)
// POST /api/internal/donors/log-touch
// ─────────────────────────────────────────────────────

export interface LogTouchRequest {
  email: string
  type: string
  touchDate?: string
  channel?: string
  purpose?: string
  mood?: string
  notes?: string
  composedVia?: string
}

export interface LogTouchResponse {
  ok: true
  touchId: string
  donorId: string
}

// ─────────────────────────────────────────────────────
// Studiolo Subscribable Donors (steampunk-studiolo)
// GET /api/internal/donors/subscribable
// ─────────────────────────────────────────────────────

export interface SubscribableDonor {
  email: string
  firstName: string | null
  lastName: string | null
  lane: string
  donorId: string
}

export interface SubscribableDonorsResponse {
  donors: SubscribableDonor[]
  count: number
  generatedAt: string
}

// ─────────────────────────────────────────────────────
// Studiolo Patreon Public (steampunk-studiolo)
// GET /api/internal/patreon-public
// ─────────────────────────────────────────────────────

export interface PatreonTier {
  slug: string
  name: string
  emoji: string
  monthlyRate: number
  seatCap: number | null
  activeMemberCount: number
  benefits: Array<{ name: string; description: string | null }>
}

export interface PatreonPatronWallEntry {
  firstName: string
  tierSlug: string
  tierSortOrder: number
}

export interface PatreonPublicResponse {
  tiers: PatreonTier[]
  patronWall: PatreonPatronWallEntry[]
  summary: {
    totalActivePatrons: number
    totalMonthlyRevenue: number
    circleSeatsRemaining: number
  }
}

// ─────────────────────────────────────────────────────
// Postmaster BI Metrics (steampunk-postmaster)
// GET /api/internal/bi-metrics
// ─────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────
// Postmaster Medical Records (steampunk-postmaster)
// POST /api/internal/medical-records
// ─────────────────────────────────────────────────────

export interface MedicalRecordInput {
  animalName: string | null
  animalSpecies: string | null
  animalBreed: string | null
  vetProviderName: string | null
  recordDate: string
  recordType: string
  title: string
  description: string | null
  totalAmount: number | null
  amountPaid: number | null
  subsidyType?: string | null
  subsidyNote?: string | null
  source: string
  sourceId: string
  documentBlobUrl: string | null
  documentName: string | null
  extractedData: string | null
  confidence: number | null
  tags: string[]
  procedures: string[]
  status: string
}

export interface MedicalRecordsRequest {
  records: MedicalRecordInput[]
}

export interface MedicalRecordsResponse {
  success: true
  total: number
  linked: number
  unlinked: number
  records: Array<{
    id: string
    title: string
    linked: boolean
    residentId: string | null
  }>
}

// ─────────────────────────────────────────────────────
// Rescue Barn Subscriber Sync (steampunk-rescuebarn)
// POST /api/internal/subscriber-sync
// ─────────────────────────────────────────────────────

export interface SubscriberSyncRequest {
  email: string
  firstName?: string | null
  source?: string
  donorId?: string
}

export interface SubscriberSyncResponse {
  ok: true
  action: 'created' | 'exists' | 'exists_race' | 'skipped'
  subscriberId?: string
  reason?: string
}

// ─────────────────────────────────────────────────────
// Cleanpunk BI Metrics (cleanpunk-shop)
// GET /api/internal/bi-metrics
// ─────────────────────────────────────────────────────

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
