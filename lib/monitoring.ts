/**
 * Fleet monitoring — Vercel API integration + health checks.
 * Used by the /monitoring page to show live deploy status across all Steampunk sites.
 */

const VERCEL_API = 'https://api.vercel.com';
const TEAM_ID = 'team_lZqpvvTB4AXWLrFU8QxFi6if';
const VERCEL_TIMEOUT_MS = 10_000;
const HEALTH_TIMEOUT_MS = 5_000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MonitoredProject {
  id: string;
  slug: string;
  name: string;
  productionUrl: string;
  healthEndpoint: string | null;
}

interface VercelLatestDeployment {
  id: string;
  url: string;
  createdAt: number;
  readyState: 'READY' | 'ERROR' | 'BUILDING' | 'QUEUED' | 'CANCELED';
  target: string | null;
}

interface VercelProjectResponse {
  id: string;
  name: string;
  framework: string | null;
  nodeVersion: string;
  latestDeployments?: VercelLatestDeployment[];
}

interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  created: number;
  state: 'READY' | 'ERROR' | 'BUILDING' | 'QUEUED' | 'CANCELED';
  target: string | null;
  meta: {
    githubCommitMessage?: string;
    githubCommitSha?: string;
    githubCommitRef?: string;
    githubCommitAuthorName?: string;
  };
  inspectorUrl: string;
}

interface VercelDeploymentsResponse {
  deployments: VercelDeployment[];
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  latencyMs: number;
  details?: Record<string, unknown>;
}

export interface ProjectStatus {
  project: MonitoredProject;
  vercel: {
    framework: string | null;
    nodeVersion: string;
    deployState: string;
    latestDeployment: {
      id: string;
      url: string;
      createdAt: number;
      commitMessage: string | null;
      commitSha: string | null;
      commitRef: string | null;
      inspectorUrl: string;
    } | null;
    recentDeployments: Array<{
      id: string;
      state: string;
      created: number;
      commitMessage: string | null;
    }>;
    errorCount: number;
  } | null;
  health: HealthCheckResult;
}

export interface FleetSummary {
  total: number;
  healthy: number;
  degraded: number;
  error: number;
  unknown: number;
  fetchedAt: string;
}

// ---------------------------------------------------------------------------
// Project configuration
// ---------------------------------------------------------------------------

export const MONITORED_PROJECTS: MonitoredProject[] = [
  {
    id: 'prj_rR1Tnb2DPlRrNMMkzSCncHH47sV7',
    slug: 'rescuebarn',
    name: 'Rescue Barn',
    productionUrl: 'https://rescuebarn.steampunkfarms.org',
    healthEndpoint: null,
  },
  {
    id: 'prj_3helajMBHMAl3C1cTfePch58gW7Z',
    slug: 'steampunk-studiolo',
    name: 'Studiolo',
    productionUrl: 'https://steampunkstudiolo.org',
    healthEndpoint: null,
  },
  {
    id: 'prj_pAybXFXJRqpimleXFmfYM1XoUTHi',
    slug: 'steampunk-postmaster',
    name: 'Postmaster',
    productionUrl: 'https://postmaster.steampunkstudiolo.org',
    healthEndpoint: null,
  },
  {
    id: 'prj_Cl8sHi87H0o5590OIR37DHKcCXYS',
    slug: 'cleanpunk-shop-storefront',
    name: 'Cleanpunk Shop',
    productionUrl: 'https://home.cleanpunk.shop',
    healthEndpoint: null,
  },
  {
    id: 'prj_c8lEBB0tyzKqMZ4xV0HvGUDANXfg',
    slug: 'steampunk-strategy',
    name: 'The Bridge',
    productionUrl: 'https://tardis.steampunkstudiolo.org',
    healthEndpoint: 'https://tardis.steampunkstudiolo.org/api/health',
  },
  {
    id: 'prj_olGSCOpe8aAqtGSsp86eyH6aRp1p',
    slug: 'steampunk-orchestrator',
    name: 'Orchestrator',
    productionUrl: 'https://steampunk-orchestrator.vercel.app',
    healthEndpoint: null,
  },
];

// ---------------------------------------------------------------------------
// Vercel API fetchers
// ---------------------------------------------------------------------------

function getHeaders(): HeadersInit {
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) throw new Error('VERCEL_API_TOKEN not set');
  return { Authorization: `Bearer ${token}` };
}

async function fetchProject(projectId: string): Promise<VercelProjectResponse | null> {
  try {
    const res = await fetch(
      `${VERCEL_API}/v9/projects/${projectId}?teamId=${TEAM_ID}`,
      { headers: getHeaders(), signal: AbortSignal.timeout(VERCEL_TIMEOUT_MS), cache: 'no-store' },
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchRecentDeployments(projectId: string, limit = 5): Promise<VercelDeployment[]> {
  try {
    const res = await fetch(
      `${VERCEL_API}/v6/deployments?projectId=${projectId}&teamId=${TEAM_ID}&limit=${limit}&target=production`,
      { headers: getHeaders(), signal: AbortSignal.timeout(VERCEL_TIMEOUT_MS), cache: 'no-store' },
    );
    if (!res.ok) return [];
    const data: VercelDeploymentsResponse = await res.json();
    return data.deployments ?? [];
  } catch {
    return [];
  }
}

async function checkHealth(url: string): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
      cache: 'no-store',
    });
    const latencyMs = Date.now() - start;
    if (!res.ok) return { status: 'degraded', latencyMs };
    const data = await res.json().catch(() => ({}));
    const hasErrors = data.database === 'error';
    return { status: hasErrors ? 'degraded' : 'healthy', latencyMs, details: data };
  } catch {
    return { status: 'down', latencyMs: Date.now() - start };
  }
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

export async function getFleetStatus(): Promise<{
  projects: ProjectStatus[];
  summary: FleetSummary;
}> {
  let tokenAvailable = true;
  try {
    getHeaders();
  } catch {
    tokenAvailable = false;
  }

  const results = await Promise.allSettled(
    MONITORED_PROJECTS.map(async (project): Promise<ProjectStatus> => {
      if (!tokenAvailable) {
        return {
          project,
          vercel: null,
          health: project.healthEndpoint
            ? await checkHealth(project.healthEndpoint)
            : { status: 'unknown', latencyMs: 0 },
        };
      }

      const [vercelProject, deployments, health] = await Promise.all([
        fetchProject(project.id),
        fetchRecentDeployments(project.id, 5),
        project.healthEndpoint
          ? checkHealth(project.healthEndpoint)
          : Promise.resolve({ status: 'unknown' as const, latencyMs: 0 }),
      ]);

      const latestDeploy = deployments[0] ?? null;
      const errorCount = deployments.filter((d) => d.state === 'ERROR').length;

      // Determine deploy state from latest production deployment
      const latestProdDeploy = vercelProject?.latestDeployments?.find(d => d.target === 'production');
      const deployState = latestProdDeploy?.readyState ?? latestDeploy?.state ?? 'UNKNOWN';

      return {
        project,
        vercel: vercelProject
          ? {
              framework: vercelProject.framework,
              nodeVersion: vercelProject.nodeVersion,
              deployState,
              latestDeployment: latestDeploy
                ? {
                    id: latestDeploy.uid,
                    url: latestDeploy.url,
                    createdAt: latestDeploy.created,
                    commitMessage: latestDeploy.meta?.githubCommitMessage ?? null,
                    commitSha: latestDeploy.meta?.githubCommitSha ?? null,
                    commitRef: latestDeploy.meta?.githubCommitRef ?? null,
                    inspectorUrl: latestDeploy.inspectorUrl,
                  }
                : null,
              recentDeployments: deployments.map((d) => ({
                id: d.uid,
                state: d.state,
                created: d.created,
                commitMessage: d.meta?.githubCommitMessage ?? null,
              })),
              errorCount,
            }
          : null,
        health,
      };
    }),
  );

  const projects = results.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : {
          project: MONITORED_PROJECTS[i],
          vercel: null,
          health: { status: 'unknown' as const, latencyMs: 0 },
        },
  );

  const summary: FleetSummary = {
    total: projects.length,
    healthy: projects.filter(
      (p) => p.vercel?.deployState === 'READY' && p.health.status !== 'down',
    ).length,
    degraded: projects.filter(
      (p) => p.health.status === 'degraded' || p.vercel?.deployState === 'BUILDING',
    ).length,
    error: projects.filter(
      (p) => p.vercel?.deployState === 'ERROR' || p.health.status === 'down',
    ).length,
    unknown: projects.filter((p) => p.vercel === null).length,
    fetchedAt: new Date().toISOString(),
  };

  return { projects, summary };
}
