// Cross-site data fetching for TARDIS BI Intelligence Platform
// Auth: INTERNAL_SECRET header for service-to-service calls
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
        'x-internal-secret': secret,
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
