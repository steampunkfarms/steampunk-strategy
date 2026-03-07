// Cross-site data fetching for TARDIS BI Intelligence Platform
// Auth: Authorization Bearer for service-to-service calls
// see docs/family-of-sites-full.md for site URLs

interface CrossSiteFetchOptions {
  timeout?: number;
  cache?: RequestCache;
}

export interface StudioloKPIs {
  totalDonors: number;
  totalGifts: number;
  totalRevenue: number;
  segments: Record<string, number>;
  [key: string]: unknown;
}

export interface StudioloDashboard {
  recentGifts: Array<{ amount: number; date: string; donorName: string }>;
  topDonors: Array<{ name: string; totalGiving: number }>;
  [key: string]: unknown;
}

export interface CommerceMetrics {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  topProducts: Array<{ name: string; revenue: number; quantity: number }>;
  [key: string]: unknown;
}

export interface PostmasterMetrics {
  totalStorms: number;
  stormsThisMonth: number;
  platformBreakdown: Record<string, number>;
  engagementRate: number;
  [key: string]: unknown;
}

// BI-2 Analytical types — see docs/handoffs/_working/20260307-bi-analytical-layer2-working-spec.md

export interface StudioloBIMetrics {
  donors: {
    total: number;
    active: number;
    lapsed: number;
    retentionRate: number;
    bySegment: Record<string, number>;
  };
  giving: {
    totalLifetime: number;
    totalGifts: number;
    avgGift: number;
    last12Months: number;
    giftsLast12Months: number;
    monthlyRecurring: number;
    annualRecurringProjection: number;
  };
  monthlyTrend: Array<{ month: string; total: number; count: number }>;
  channelBreakdown: Array<{ channel: string; total: number; count: number }>;
  generatedAt: string;
}

export interface CleanpunkBIMetrics {
  orders: {
    totalAllTime: number;
    totalYTD: number;
    totalPriorYear: number;
    countYTD: number;
    avgOrderValue: number;
  };
  revenue: {
    grossYTD: number;
    grossPriorYear: number;
    yoyChangePct: number;
    byMonth: Array<{ month: string; gross: number; orderCount: number }>;
    byCollection: Array<{ collection: string; revenue: number; units: number }>;
  };
  customers: {
    total: number;
    newYTD: number;
    repeatPurchasers: number;
  };
  products: {
    totalActive: number;
    lowStock: Array<{ name: string; variant: string; inventory: number }>;
    topSellers: Array<{ name: string; units: number; revenue: number }>;
  };
  fetchedAt: string;
}

export interface PostmasterBIMetrics {
  temperature: {
    totalContacts: number;
    avgScore: number;
    distribution: { hot: number; warm: number; cool: number; cold: number; unknown: number };
  };
  engagement: {
    last30Days: number;
    byPlatform: Record<string, number>;
    bySignalTier: Record<string, number>;
  };
  donorCorrelation: Array<{
    studioloId: string;
    temperatureScore: number | null;
    temperatureLabel: string | null;
    totalComments: number;
    totalReactions: number;
    totalMessages: number;
    donorTier: string | null;
  }>;
  generatedAt: string;
}

function getSiteUrl(envInternal: string | undefined, envPublic: string | undefined): string {
  return envInternal || envPublic || '';
}

async function internalFetch<T>(url: string, options?: CrossSiteFetchOptions): Promise<T> {
  const secret = process.env.INTERNAL_SECRET;
  if (!secret) {
    throw new Error('INTERNAL_SECRET not configured');
  }
  if (!url) {
    throw new Error('Site URL not configured');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options?.timeout ?? 10000);

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      cache: options?.cache ?? 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Cross-site fetch failed: ${response.status} ${response.statusText} (${url})`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Cross-site fetch timed out after ${options?.timeout ?? 10000}ms (${url})`);
    }
    console.error(`[cross-site] Fetch error for ${url}:`, error);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

const studioloUrl = () => getSiteUrl(process.env.STUDIOLO_INTERNAL_URL, process.env.STUDIOLO_API_URL);
const postmasterUrl = () => getSiteUrl(process.env.POSTMASTER_INTERNAL_URL, process.env.POSTMASTER_API_URL);
const cleanpunkUrl = () => getSiteUrl(process.env.CLEANPUNK_INTERNAL_URL, process.env.MEDUSA_BACKEND_URL);

export async function fetchStudioloKPIs(options?: CrossSiteFetchOptions): Promise<StudioloKPIs> {
  return internalFetch<StudioloKPIs>(`${studioloUrl()}/api/internal/kpis`, options);
}

export async function fetchStudioloDashboard(options?: CrossSiteFetchOptions): Promise<StudioloDashboard> {
  return internalFetch<StudioloDashboard>(`${studioloUrl()}/api/internal/dashboard`, options);
}

export async function fetchStudioloCommerceMetrics(options?: CrossSiteFetchOptions): Promise<CommerceMetrics> {
  return internalFetch<CommerceMetrics>(`${studioloUrl()}/api/internal/commerce`, options);
}

export async function fetchPostmasterMetrics(options?: CrossSiteFetchOptions): Promise<PostmasterMetrics> {
  return internalFetch<PostmasterMetrics>(`${postmasterUrl()}/api/internal/metrics`, options);
}

// BI-2 Analytical cross-site fetchers

export async function fetchStudioloBIMetrics(options?: CrossSiteFetchOptions): Promise<StudioloBIMetrics> {
  return internalFetch<StudioloBIMetrics>(`${studioloUrl()}/api/internal/bi-metrics`, options);
}

export async function fetchPostmasterBIMetrics(options?: CrossSiteFetchOptions): Promise<PostmasterBIMetrics> {
  return internalFetch<PostmasterBIMetrics>(`${postmasterUrl()}/api/internal/bi-metrics`, options);
}

export async function fetchCleanpunkBIMetrics(options?: CrossSiteFetchOptions): Promise<CleanpunkBIMetrics> {
  return internalFetch<CleanpunkBIMetrics>(`${cleanpunkUrl()}/api/internal/bi-metrics`, options);
}
