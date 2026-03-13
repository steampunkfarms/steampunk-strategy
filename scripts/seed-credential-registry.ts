// postest
// Seed the CredentialRegistry with the full inventory of credentials
// across all 6 Steampunk Farms repos. Run with: npx tsx scripts/seed-credential-registry.ts
// see docs/handoffs/_working/20260312-credential-registry-working-spec.md

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

interface CredentialSeed {
  name: string;
  slug: string;
  provider: string;
  category: string;
  envMappings: Array<{ repo: string; envVar: string }>;
  expiresAt?: Date | null;
  reminderDays?: number;
  riskLevel: string;
  failureImpact: string;
  rotationGuide: string;
  rotationUrl?: string;
  verifyEndpoint?: string;
  autoRotatable?: boolean;
}

const CREDENTIALS: CredentialSeed[] = [
  // ═══════════════════════════════════════════════════════════════
  // CRITICAL — Expiring tokens that kill major functionality
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'Azure AD Client Secret',
    slug: 'azure-ad-client-secret',
    provider: 'microsoft',
    category: 'oauth_token',
    envMappings: [
      { repo: 'steampunk-studiolo', envVar: 'AZURE_AD_CLIENT_SECRET' },
      { repo: 'steampunk-postmaster', envVar: 'AZURE_AD_CLIENT_SECRET' },
      { repo: 'steampunk-strategy', envVar: 'AZURE_AD_CLIENT_SECRET' },
    ],
    reminderDays: 60,
    riskLevel: 'critical',
    failureImpact: 'Admin auth fails on Studiolo, Postmaster, and TARDIS simultaneously. All three dashboards become inaccessible.',
    rotationGuide: 'Entra ID → App registrations → Steampunk Farms → Certificates & secrets → New client secret. Update all 3 Vercel projects.',
    rotationUrl: 'https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps',
  },
  {
    name: 'Facebook Page Access Token',
    slug: 'facebook-access-token',
    provider: 'meta',
    category: 'oauth_token',
    reminderDays: 14,
    riskLevel: 'critical',
    failureImpact: 'Content storms stop publishing to Facebook/Instagram. Social intelligence metrics go dark. Engagement scanner fails.',
    rotationGuide: 'Meta Business Suite → Settings → Integrations → Access Tokens, or Graph API Explorer → Generate Long-Lived Token. Update Postmaster + Studiolo + Rescue Barn Vercel.',
    rotationUrl: 'https://developers.facebook.com/tools/explorer/',
    envMappings: [
      { repo: 'steampunk-postmaster', envVar: 'FACEBOOK_ACCESS_TOKEN' },
      { repo: 'steampunk-studiolo', envVar: 'FACEBOOK_ACCESS_TOKEN' },
      { repo: 'steampunk-rescuebarn', envVar: 'FACEBOOK_ACCESS_TOKEN' },
    ],
  },
  {
    name: 'Google OAuth Refresh Token',
    slug: 'google-oauth-refresh-token',
    provider: 'google',
    category: 'oauth_token',
    reminderDays: 30,
    riskLevel: 'high',
    failureImpact: 'Gmail receipt scanning stops (TARDIS + Postmaster). Donor inbox scanning stops (Studiolo). No automatic financial email import.',
    rotationGuide: 'Run the OAuth consent flow again via Google Cloud Console → APIs & Services → Credentials. Re-authorize the app to get a new refresh token.',
    rotationUrl: 'https://console.cloud.google.com/apis/credentials',
    envMappings: [
      { repo: 'steampunk-strategy', envVar: 'GOOGLE_REFRESH_TOKEN' },
      { repo: 'steampunk-studiolo', envVar: 'GOOGLE_REFRESH_TOKEN' },
      { repo: 'steampunk-postmaster', envVar: 'GOOGLE_REFRESH_TOKEN' },
    ],
  },
  // ═══════════════════════════════════════════════════════════════
  // HIGH — API keys that don't expire but are critical if revoked
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'Anthropic API Key',
    slug: 'anthropic-api-key',
    provider: 'anthropic',
    category: 'api_key',
    riskLevel: 'high',
    failureImpact: 'All AI features fail: content generation, email triage, document parsing, FAQ chat, moderation, donor extraction, expense categorization.',
    rotationGuide: 'Anthropic Console → API Keys → Create Key. Update all 4 repos in Vercel.',
    rotationUrl: 'https://console.anthropic.com/settings/keys',
    verifyEndpoint: 'anthropic-api',
    envMappings: [
      { repo: 'steampunk-strategy', envVar: 'ANTHROPIC_API_KEY' },
      { repo: 'steampunk-studiolo', envVar: 'ANTHROPIC_API_KEY' },
      { repo: 'steampunk-postmaster', envVar: 'ANTHROPIC_API_KEY' },
      { repo: 'steampunk-rescuebarn', envVar: 'ANTHROPIC_API_KEY' },
    ],
  },
  {
    name: 'Stripe Secret Key',
    slug: 'stripe-secret-key',
    provider: 'stripe',
    category: 'api_key',
    riskLevel: 'high',
    failureImpact: 'Donation processing fails on Rescue Barn. Stripe sync stops on Studiolo and TARDIS.',
    rotationGuide: 'Stripe Dashboard → Developers → API Keys → Reveal live secret key (or roll key). Update 3 repos in Vercel.',
    rotationUrl: 'https://dashboard.stripe.com/apikeys',
    verifyEndpoint: 'stripe-api',
    envMappings: [
      { repo: 'steampunk-rescuebarn', envVar: 'STRIPE_SECRET_KEY' },
      { repo: 'steampunk-studiolo', envVar: 'STRIPE_SECRET_KEY' },
      { repo: 'steampunk-strategy', envVar: 'STRIPE_SECRET_KEY' },
    ],
  },
  {
    name: 'Resend API Key',
    slug: 'resend-api-key',
    provider: 'resend',
    category: 'api_key',
    riskLevel: 'high',
    failureImpact: 'All outbound email stops: auto-replies, newsletter, donor acknowledgments, forwarding. Inbound email still arrives but cannot be forwarded or replied to.',
    rotationGuide: 'Resend Dashboard → API Keys → Create API Key. Update Rescue Barn Vercel.',
    rotationUrl: 'https://resend.com/api-keys',
    envMappings: [{ repo: 'steampunk-rescuebarn', envVar: 'RESEND_API_KEY' }],
  },
  {
    name: 'Supabase Service Role Key',
    slug: 'supabase-service-role-key',
    provider: 'supabase',
    category: 'api_key',
    riskLevel: 'high',
    failureImpact: 'All server-side Supabase operations fail on Rescue Barn: admin queries, RLS bypass, email triage logging, spam filter, newsletter management.',
    rotationGuide: 'Supabase Dashboard → Project Settings → API → service_role key. Update Rescue Barn Vercel.',
    rotationUrl: 'https://supabase.com/dashboard/project/_/settings/api',
    envMappings: [{ repo: 'steampunk-rescuebarn', envVar: 'SUPABASE_SERVICE_ROLE_KEY' }],
  },
  // ═══════════════════════════════════════════════════════════════
  // MEDIUM — Platform tokens and secondary API keys
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'X / Twitter API Key',
    slug: 'x-api-key',
    provider: 'x-twitter',
    category: 'api_key',
    riskLevel: 'medium',
    failureImpact: 'X/Twitter posting and storm threads stop. Social intelligence for X metrics stops.',
    rotationGuide: 'X Developer Portal → Projects & Apps → Keys and tokens → Regenerate. Update Studiolo + Postmaster. Note: 4 env vars (key, secret, access token, access token secret).',
    rotationUrl: 'https://developer.x.com/en/portal/dashboard',
    envMappings: [
      { repo: 'steampunk-studiolo', envVar: 'X_API_KEY' },
      { repo: 'steampunk-studiolo', envVar: 'X_API_SECRET' },
      { repo: 'steampunk-studiolo', envVar: 'X_ACCESS_TOKEN' },
      { repo: 'steampunk-studiolo', envVar: 'X_ACCESS_TOKEN_SECRET' },
      { repo: 'steampunk-postmaster', envVar: 'X_API_KEY' },
      { repo: 'steampunk-postmaster', envVar: 'X_API_SECRET' },
      { repo: 'steampunk-postmaster', envVar: 'X_ACCESS_TOKEN' },
      { repo: 'steampunk-postmaster', envVar: 'X_ACCESS_TOKEN_SECRET' },
    ],
  },
  {
    name: 'Vercel Blob Token',
    slug: 'vercel-blob-token',
    provider: 'vercel',
    category: 'api_key',
    riskLevel: 'medium',
    failureImpact: 'Document uploads fail on TARDIS. Media uploads fail on Postmaster. Asset uploads fail on Rescue Barn.',
    rotationGuide: 'Vercel Dashboard → Project → Storage → Blob → Manage → Tokens. Update affected repos.',
    rotationUrl: 'https://vercel.com/dashboard/stores',
    envMappings: [
      { repo: 'steampunk-strategy', envVar: 'BLOB_READ_WRITE_TOKEN' },
      { repo: 'steampunk-postmaster', envVar: 'BLOB_READ_WRITE_TOKEN' },
      { repo: 'steampunk-rescuebarn', envVar: 'BLOB_READ_WRITE_TOKEN' },
      { repo: 'steampunk-studiolo', envVar: 'BLOB_READ_WRITE_TOKEN' },
    ],
  },
  {
    name: 'Vercel API Token',
    slug: 'vercel-api-token',
    provider: 'vercel',
    category: 'api_key',
    riskLevel: 'medium',
    failureImpact: 'Fleet monitoring dashboard shows no data. Phase 2 credential rotation via Vercel API will not work.',
    rotationGuide: 'Vercel Dashboard → Account Settings → Tokens → Create Token (scope: read-only).',
    rotationUrl: 'https://vercel.com/account/tokens',
    envMappings: [{ repo: 'steampunk-strategy', envVar: 'VERCEL_API_TOKEN' }],
  },
  {
    name: 'OpenAI API Key',
    slug: 'openai-api-key',
    provider: 'openai',
    category: 'api_key',
    riskLevel: 'medium',
    failureImpact: 'Whisper voice transcription for Chronicle field notes stops.',
    rotationGuide: 'OpenAI Platform → API Keys → Create new secret key. Update Postmaster Vercel.',
    rotationUrl: 'https://platform.openai.com/api-keys',
    envMappings: [{ repo: 'steampunk-postmaster', envVar: 'OPENAI_API_KEY' }],
  },
  {
    name: 'PayPal Client Credentials',
    slug: 'paypal-credentials',
    provider: 'paypal',
    category: 'api_key',
    riskLevel: 'medium',
    failureImpact: 'PayPal donation webhook verification fails. PayPal giving data stops syncing to Studiolo.',
    rotationGuide: 'PayPal Developer Dashboard → My Apps & Credentials → Live app → Client ID/Secret. Update Studiolo Vercel.',
    rotationUrl: 'https://developer.paypal.com/dashboard/applications',
    envMappings: [
      { repo: 'steampunk-studiolo', envVar: 'PAYPAL_CLIENT_ID' },
      { repo: 'steampunk-studiolo', envVar: 'PAYPAL_CLIENT_SECRET' },
    ],
  },
  {
    name: 'Twilio Credentials',
    slug: 'twilio-credentials',
    provider: 'twilio',
    category: 'api_key',
    riskLevel: 'medium',
    failureImpact: 'SMS Chronicle gateway stops. Caretakers cannot submit field notes via text.',
    rotationGuide: 'Twilio Console → Account → API keys and tokens → Auth Tokens. Update Postmaster Vercel.',
    rotationUrl: 'https://console.twilio.com/us1/account/keys-credentials/api-keys',
    envMappings: [
      { repo: 'steampunk-postmaster', envVar: 'TWILIO_ACCOUNT_SID' },
      { repo: 'steampunk-postmaster', envVar: 'TWILIO_AUTH_TOKEN' },
    ],
  },
  {
    name: 'YouTube Data API Key',
    slug: 'youtube-api-key',
    provider: 'google',
    category: 'api_key',
    riskLevel: 'low',
    failureImpact: 'YouTube video import to Cogworks stops. Not critical for daily ops.',
    rotationGuide: 'Google Cloud Console → APIs & Services → Credentials → API Key. Update Rescue Barn Vercel.',
    rotationUrl: 'https://console.cloud.google.com/apis/credentials',
    envMappings: [{ repo: 'steampunk-rescuebarn', envVar: 'YOUTUBE_API_KEY' }],
  },
  // ═══════════════════════════════════════════════════════════════
  // GENERATED SECRETS — Never expire, rotate for hygiene
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'Internal Secret (Cross-Site Auth)',
    slug: 'internal-secret',
    provider: 'internal',
    category: 'generated_secret',
    reminderDays: 180,
    riskLevel: 'critical',
    failureImpact: 'ALL cross-site communication fails. TARDIS email inbound, donor lookups, touch logging, BI metrics, cron forwarding — everything between sites breaks.',
    rotationGuide: 'Generate with: openssl rand -hex 32. Must be identical across ALL 6 Vercel projects. Update all at once, then redeploy all.',
    envMappings: [
      { repo: 'steampunk-strategy', envVar: 'INTERNAL_SECRET' },
      { repo: 'steampunk-studiolo', envVar: 'INTERNAL_SECRET' },
      { repo: 'steampunk-postmaster', envVar: 'INTERNAL_SECRET' },
      { repo: 'steampunk-rescuebarn', envVar: 'INTERNAL_SECRET' },
      { repo: 'steampunk-orchestrator', envVar: 'INTERNAL_SECRET' },
      { repo: 'cleanpunk-shop', envVar: 'INTERNAL_SECRET' },
    ],
  },
  {
    name: 'NextAuth Secret',
    slug: 'nextauth-secret',
    provider: 'internal',
    category: 'generated_secret',
    reminderDays: 365,
    riskLevel: 'high',
    failureImpact: 'Session tokens become invalid. All logged-in users are forced to re-authenticate.',
    rotationGuide: 'Generate with: openssl rand -base64 32. Each site has its own value. Update Studiolo, Postmaster, and TARDIS Vercel projects individually.',
    envMappings: [
      { repo: 'steampunk-studiolo', envVar: 'NEXTAUTH_SECRET' },
      { repo: 'steampunk-postmaster', envVar: 'NEXTAUTH_SECRET' },
      { repo: 'steampunk-strategy', envVar: 'NEXTAUTH_SECRET' },
    ],
  },
  {
    name: 'Cron Secret (Vercel)',
    slug: 'cron-secret',
    provider: 'vercel',
    category: 'generated_secret',
    reminderDays: 365,
    riskLevel: 'high',
    failureImpact: 'All Vercel cron jobs fail auth. Scheduled tasks (gmail scanning, compliance reminders, health checks) stop running.',
    rotationGuide: 'Vercel Dashboard → Project → Settings → Environment Variables → CRON_SECRET. Vercel auto-generates this for cron-enabled projects.',
    envMappings: [
      { repo: 'steampunk-strategy', envVar: 'CRON_SECRET' },
      { repo: 'steampunk-rescuebarn', envVar: 'CRON_SECRET' },
      { repo: 'steampunk-postmaster', envVar: 'CRON_SECRET' },
      { repo: 'steampunk-orchestrator', envVar: 'CRON_SECRET' },
    ],
  },
  {
    name: 'Resend Webhook Secret',
    slug: 'resend-webhook-secret',
    provider: 'resend',
    category: 'webhook_secret',
    riskLevel: 'high',
    failureImpact: 'Inbound email webhook rejects all emails. No email forwarding, no AI triage, no TARDIS routing.',
    rotationGuide: 'Resend Dashboard → Webhooks → Edit → Signing Secret. Update Rescue Barn Vercel.',
    rotationUrl: 'https://resend.com/webhooks',
    envMappings: [{ repo: 'steampunk-rescuebarn', envVar: 'RESEND_WEBHOOK_SECRET' }],
  },
  {
    name: 'Stripe Webhook Secret',
    slug: 'stripe-webhook-secret',
    provider: 'stripe',
    category: 'webhook_secret',
    riskLevel: 'medium',
    failureImpact: 'Stripe donation webhooks fail verification. New donations not reflected in real time.',
    rotationGuide: 'Stripe Dashboard → Developers → Webhooks → Signing secret. Update Rescue Barn Vercel.',
    rotationUrl: 'https://dashboard.stripe.com/webhooks',
    envMappings: [{ repo: 'steampunk-rescuebarn', envVar: 'STRIPE_WEBHOOK_SECRET' }],
  },
  {
    name: 'Patreon Webhook Secret',
    slug: 'patreon-webhook-secret',
    provider: 'patreon',
    category: 'webhook_secret',
    riskLevel: 'low',
    failureImpact: 'Patreon membership webhooks fail. New patron data not synced.',
    rotationGuide: 'Patreon Developers → Webhooks → Edit → Secret. Note: Patreon uses MD5 HMAC (platform limitation).',
    rotationUrl: 'https://www.patreon.com/portal/registration/register-webhooks',
    envMappings: [
      { repo: 'steampunk-studiolo', envVar: 'PATREON_WEBHOOK_SECRET' },
      { repo: 'steampunk-postmaster', envVar: 'PATREON_WEBHOOK_SECRET' },
    ],
  },
  {
    name: 'Google OAuth Client Credentials',
    slug: 'google-oauth-client',
    provider: 'google',
    category: 'service_account',
    riskLevel: 'medium',
    failureImpact: 'Cannot re-authorize Gmail scanning if refresh token is revoked. Blocks all Google API access.',
    rotationGuide: 'Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client → Edit. Update Client ID and Secret in all repos that use Gmail.',
    rotationUrl: 'https://console.cloud.google.com/apis/credentials',
    envMappings: [
      { repo: 'steampunk-strategy', envVar: 'GOOGLE_CLIENT_ID' },
      { repo: 'steampunk-strategy', envVar: 'GOOGLE_CLIENT_SECRET' },
      { repo: 'steampunk-studiolo', envVar: 'GOOGLE_CLIENT_ID' },
      { repo: 'steampunk-studiolo', envVar: 'GOOGLE_CLIENT_SECRET' },
      { repo: 'steampunk-postmaster', envVar: 'GOOGLE_CLIENT_ID' },
      { repo: 'steampunk-postmaster', envVar: 'GOOGLE_CLIENT_SECRET' },
    ],
  },
];

async function main() {
  console.log(`Seeding ${CREDENTIALS.length} credentials to CredentialRegistry...`);

  for (const cred of CREDENTIALS) {
    const existing = await prisma.credentialRegistry.findUnique({
      where: { slug: cred.slug },
    });

    if (existing) {
      console.log(`  ⏭ ${cred.name} — already exists, skipping`);
      continue;
    }

    await prisma.credentialRegistry.create({
      data: {
        name: cred.name,
        slug: cred.slug,
        provider: cred.provider,
        category: cred.category,
        envMappings: JSON.stringify(cred.envMappings),
        expiresAt: cred.expiresAt ?? null,
        reminderDays: cred.reminderDays ?? 30,
        riskLevel: cred.riskLevel,
        failureImpact: cred.failureImpact,
        rotationGuide: cred.rotationGuide,
        rotationUrl: cred.rotationUrl ?? null,
        verifyEndpoint: cred.verifyEndpoint ?? null,
        autoRotatable: cred.autoRotatable ?? false,
        status: 'active',
      },
    });

    console.log(`  ✅ ${cred.name} (${cred.envMappings.length} env vars across ${new Set(cred.envMappings.map(m => m.repo)).size} repos)`);
  }

  console.log('\nDone. Run the health check cron to verify credentials.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
