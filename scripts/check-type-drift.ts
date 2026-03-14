// postest
// Cross-Site Type Drift Checker
// Compares canonical cross-site-types.ts against per-repo internal-contracts.ts copies.
// Usage: npx tsx scripts/check-type-drift.ts
// see docs/handoffs/20260313-cross-site-type-drift.md

import { readFileSync, existsSync } from 'fs'
import { resolve, basename } from 'path'

const CANONICAL_PATH = resolve(__dirname, '../docs/contracts/cross-site-types.ts')

// Each repo's contract file and the interfaces it should contain
const REPO_CONTRACTS: Array<{
  repo: string
  path: string
  expectedInterfaces: string[]
}> = [
  {
    repo: 'steampunk-studiolo',
    path: resolve(__dirname, '../../steampunk-studiolo/lib/internal-contracts.ts'),
    expectedInterfaces: [
      'StudioloBIMetrics',
      'DonorLookupFound',
      'DonorLookupNotFound',
      'DonorLookupResponse',
      'LogTouchRequest',
      'LogTouchResponse',
      'SubscribableDonor',
      'SubscribableDonorsResponse',
      'PatreonTier',
      'PatreonPatronWallEntry',
      'PatreonPublicResponse',
    ],
  },
  {
    repo: 'steampunk-postmaster',
    path: resolve(__dirname, '../../steampunk-postmaster/lib/internal-contracts.ts'),
    expectedInterfaces: [
      'ProgramImpact',
      'AllProgramsResponse',
      'PostmasterBIMetrics',
      'MedicalRecordInput',
      'MedicalRecordsRequest',
      'MedicalRecordsResponse',
    ],
  },
  {
    repo: 'steampunk-rescuebarn',
    path: resolve(__dirname, '../../steampunk-rescuebarn/lib/internal-contracts.ts'),
    expectedInterfaces: [
      'SubscriberSyncRequest',
      'SubscriberSyncResponse',
    ],
  },
  {
    repo: 'cleanpunk-shop',
    path: resolve(__dirname, '../../cleanpunk-shop/apps/storefront/lib/internal-contracts.ts'),
    expectedInterfaces: [
      'CleanpunkBIMetrics',
    ],
  },
  {
    repo: 'steampunk-strategy',
    path: resolve(__dirname, '../lib/internal-contracts.ts'),
    expectedInterfaces: [
      'ProgramImpact',
      'AllProgramsResponse',
      'StudioloBIMetrics',
      'CleanpunkBIMetrics',
      'PostmasterBIMetrics',
    ],
  },
]

// ─────────────────────────────────────────────────────
// Lightweight structural parser
// Extracts interface names and their body text from a .ts file
// ─────────────────────────────────────────────────────

interface ParsedInterface {
  name: string
  body: string // normalized body text (whitespace-collapsed, sorted members)
}

function extractInterfaces(source: string): Map<string, ParsedInterface> {
  const result = new Map<string, ParsedInterface>()

  // Match exported and non-exported interfaces
  const interfaceRegex = /(?:export\s+)?interface\s+(\w+)(?:\s+extends\s+[\w,\s]+)?\s*\{/g
  let match: RegExpExecArray | null

  while ((match = interfaceRegex.exec(source)) !== null) {
    const name = match[1]
    const startIdx = match.index + match[0].length
    let depth = 1
    let i = startIdx

    while (i < source.length && depth > 0) {
      if (source[i] === '{') depth++
      else if (source[i] === '}') depth--
      i++
    }

    const body = source.slice(startIdx, i - 1)
    const normalized = normalizeBody(body)
    result.set(name, { name, body: normalized })
  }

  // Also handle type aliases (e.g., `export type Foo = A | B`)
  const typeRegex = /(?:export\s+)?type\s+(\w+)\s*=\s*([^;]+);?/g
  while ((match = typeRegex.exec(source)) !== null) {
    const name = match[1]
    const body = normalizeBody(match[2])
    result.set(name, { name, body })
  }

  return result
}

function normalizeBody(body: string): string {
  return body
    .replace(/\/\/.*$/gm, '')       // strip line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // strip block comments
    .replace(/\s+/g, ' ')           // collapse whitespace
    .replace(/;\s*/g, '; ')         // normalize semicolons
    .trim()
}

// ─────────────────────────────────────────────────────
// Drift detection
// ─────────────────────────────────────────────────────

interface DriftResult {
  repo: string
  filePath: string
  missing: boolean
  missingInterfaces: string[]
  driftedInterfaces: Array<{
    name: string
    canonicalSnippet: string
    repoSnippet: string
  }>
}

function checkDrift(): DriftResult[] {
  if (!existsSync(CANONICAL_PATH)) {
    console.error(`❌ Canonical file not found: ${CANONICAL_PATH}`)
    process.exit(1)
  }

  const canonicalSource = readFileSync(CANONICAL_PATH, 'utf-8')
  const canonicalInterfaces = extractInterfaces(canonicalSource)
  const results: DriftResult[] = []

  for (const contract of REPO_CONTRACTS) {
    const result: DriftResult = {
      repo: contract.repo,
      filePath: contract.path,
      missing: false,
      missingInterfaces: [],
      driftedInterfaces: [],
    }

    if (!existsSync(contract.path)) {
      result.missing = true
      result.missingInterfaces = contract.expectedInterfaces
      results.push(result)
      continue
    }

    const repoSource = readFileSync(contract.path, 'utf-8')
    const repoInterfaces = extractInterfaces(repoSource)

    for (const ifaceName of contract.expectedInterfaces) {
      const canonical = canonicalInterfaces.get(ifaceName)
      const repo = repoInterfaces.get(ifaceName)

      if (!canonical) {
        // Interface listed in expectedInterfaces but not in canonical — config error
        console.warn(`⚠️  ${ifaceName} listed for ${contract.repo} but not found in canonical file`)
        continue
      }

      if (!repo) {
        result.missingInterfaces.push(ifaceName)
        continue
      }

      if (canonical.body !== repo.body) {
        result.driftedInterfaces.push({
          name: ifaceName,
          canonicalSnippet: canonical.body.slice(0, 120),
          repoSnippet: repo.body.slice(0, 120),
        })
      }
    }

    results.push(result)
  }

  return results
}

// ─────────────────────────────────────────────────────
// Report
// ─────────────────────────────────────────────────────

function main() {
  console.log('🔍 Cross-Site Type Drift Check')
  console.log(`   Canonical: ${basename(CANONICAL_PATH)}`)
  console.log('')

  const results = checkDrift()
  let hasIssues = false

  for (const r of results) {
    if (r.missing) {
      console.log(`❌ ${r.repo}: contract file MISSING`)
      console.log(`   Expected: ${r.filePath}`)
      console.log(`   Missing interfaces: ${r.missingInterfaces.join(', ')}`)
      hasIssues = true
      continue
    }

    const issues = r.missingInterfaces.length + r.driftedInterfaces.length
    if (issues === 0) {
      console.log(`✅ ${r.repo}: all ${REPO_CONTRACTS.find(c => c.repo === r.repo)!.expectedInterfaces.length} interfaces aligned`)
      continue
    }

    hasIssues = true
    console.log(`⚠️  ${r.repo}: ${issues} issue(s)`)

    for (const name of r.missingInterfaces) {
      console.log(`   MISSING: ${name}`)
    }

    for (const d of r.driftedInterfaces) {
      console.log(`   DRIFTED: ${d.name}`)
      console.log(`     canonical: ${d.canonicalSnippet}...`)
      console.log(`     repo:      ${d.repoSnippet}...`)
    }
  }

  console.log('')
  if (hasIssues) {
    console.log('❌ Drift detected. Update per-repo contracts from canonical source.')
    process.exit(1)
  } else {
    console.log('✅ All contracts aligned with canonical types.')
    process.exit(0)
  }
}

main()
