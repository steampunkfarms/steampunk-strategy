#!/usr/bin/env node

/**
 * Position Bias Experiment — Analysis & Stop-Trigger Check
 *
 * Usage:
 *   node scripts/position-bias-analysis.mjs           # full analysis
 *   node scripts/position-bias-analysis.mjs --check    # just check stop triggers (for session start)
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const LOG_PATH = resolve(__dirname, '../docs/experiments/position-bias-log.jsonl')
const DEADLINE = new Date('2026-04-10')
const SESSIONS_PER_PHASE = 10
const EARLY_SIGNAL_MIN = 5
const EARLY_SIGNAL_DELTA = 0.40

const checkOnly = process.argv.includes('--check')

// Parse log
if (!existsSync(LOG_PATH)) {
  console.log('No log file found. Experiment not started.')
  process.exit(0)
}

const raw = readFileSync(LOG_PATH, 'utf-8').trim()
if (!raw) {
  if (checkOnly) {
    console.log('POSTEST: No sessions logged yet. Experiment awaiting first entry.')
    process.exit(0)
  }
  console.log('No sessions logged yet.')
  process.exit(0)
}

const entries = raw.split('\n').map((line, i) => {
  try { return JSON.parse(line) }
  catch { console.error(`Bad JSON on line ${i + 1}`); return null }
}).filter(Boolean)

const phaseA = entries.filter(e => e.phase === 'A')
const phaseB = entries.filter(e => e.phase === 'B')

// Compliance calculator
function calcCompliance(sessions) {
  const ruleIds = ['1', '2', '3', '4', '5']
  const perRule = {}
  let totalApplicable = 0
  let totalComplied = 0

  for (const id of ruleIds) {
    let applicable = 0
    let complied = 0
    for (const s of sessions) {
      const val = s.rules?.[id]
      if (val === null || val === undefined) continue
      applicable++
      if (val === true) complied++
    }
    perRule[id] = { applicable, complied, rate: applicable > 0 ? complied / applicable : null }
    totalApplicable += applicable
    totalComplied += complied
  }

  return {
    perRule,
    overall: totalApplicable > 0 ? totalComplied / totalApplicable : null,
    totalApplicable,
    totalComplied,
    sessions: sessions.length
  }
}

// Check stop triggers
const now = new Date()
const triggers = []

if (phaseA.length >= SESSIONS_PER_PHASE) triggers.push(`Phase A complete (${phaseA.length} sessions)`)
if (phaseB.length >= SESSIONS_PER_PHASE) triggers.push(`Phase B complete (${phaseB.length} sessions)`)
if (now >= DEADLINE) triggers.push(`Calendar deadline reached (${DEADLINE.toISOString().split('T')[0]})`)

// Early signal check
if (phaseA.length >= EARLY_SIGNAL_MIN && phaseB.length >= EARLY_SIGNAL_MIN) {
  const aRate = calcCompliance(phaseA).overall
  const bRate = calcCompliance(phaseB).overall
  if (aRate !== null && bRate !== null && Math.abs(aRate - bRate) > EARLY_SIGNAL_DELTA) {
    triggers.push(`Early signal: ${Math.round(Math.abs(aRate - bRate) * 100)}% delta after ${phaseA.length}A/${phaseB.length}B sessions`)
  }
}

if (checkOnly) {
  if (triggers.length > 0) {
    console.log('┌──────────────────────────────────────────────────┐')
    console.log('│ POSITION BIAS EXPERIMENT — REVIEW TRIGGERED      │')
    console.log('│                                                  │')
    console.log(`│ Trigger: ${triggers[0].padEnd(39)}│`)
    console.log(`│ Sessions logged: A=${phaseA.length}, B=${phaseB.length}`.padEnd(51) + '│')
    console.log('│ Action: Run full analysis before continuing      │')
    console.log('│                                                  │')
    console.log('│ Command: node scripts/position-bias-analysis.mjs │')
    console.log('└──────────────────────────────────────────────────┘')
    process.exit(1) // nonzero = trigger fired
  } else {
    const nextPhase = phaseA.length < SESSIONS_PER_PHASE ? 'A' : 'B'
    const remaining = nextPhase === 'A'
      ? SESSIONS_PER_PHASE - phaseA.length
      : SESSIONS_PER_PHASE - phaseB.length
    console.log(`POSTEST: Phase ${nextPhase} active. ${remaining} sessions remaining. Deadline: ${DEADLINE.toISOString().split('T')[0]}.`)
    process.exit(0)
  }
}

// Full analysis
console.log('═══════════════════════════════════════════════')
console.log('  POSITION BIAS EXPERIMENT — ANALYSIS REPORT')
console.log('═══════════════════════════════════════════════')
console.log()

if (triggers.length > 0) {
  console.log('STOP TRIGGERS FIRED:')
  triggers.forEach(t => console.log(`  ⚡ ${t}`))
  console.log()
}

const statsA = calcCompliance(phaseA)
const statsB = calcCompliance(phaseB)

function printPhase(label, stats) {
  console.log(`── ${label} ──`)
  console.log(`  Sessions: ${stats.sessions}`)
  if (stats.overall !== null) {
    console.log(`  Overall compliance: ${(stats.overall * 100).toFixed(1)}% (${stats.totalComplied}/${stats.totalApplicable})`)
    console.log('  Per rule:')
    for (const [id, r] of Object.entries(stats.perRule)) {
      const rate = r.rate !== null ? `${(r.rate * 100).toFixed(0)}%` : 'n/a'
      console.log(`    POSTEST-${id}: ${rate} (${r.complied}/${r.applicable})`)
    }
  } else {
    console.log('  No data yet.')
  }
  console.log()
}

printPhase('Phase A (top of file)', statsA)
printPhase('Phase B (bottom of file)', statsB)

if (statsA.overall !== null && statsB.overall !== null) {
  const delta = statsA.overall - statsB.overall
  console.log('── Comparison ──')
  console.log(`  Phase A: ${(statsA.overall * 100).toFixed(1)}%`)
  console.log(`  Phase B: ${(statsB.overall * 100).toFixed(1)}%`)
  console.log(`  Delta (A - B): ${delta > 0 ? '+' : ''}${(delta * 100).toFixed(1)} percentage points`)
  console.log()

  if (Math.abs(delta) < 10) {
    console.log('  INTERPRETATION: No meaningful difference detected.')
    console.log('  Position within CLAUDE.md likely does not affect compliance.')
  } else if (delta > 0) {
    console.log('  INTERPRETATION: Top-of-file placement shows higher compliance.')
    console.log('  Position bias appears real. Keep critical rules near the top.')
  } else {
    console.log('  INTERPRETATION: Bottom-of-file placement shows higher compliance.')
    console.log('  Unexpected result — possible recency bias. Investigate further.')
  }
  console.log()
  console.log('  CAVEAT: n=' + SESSIONS_PER_PHASE + ' per phase. This detects large effects only.')
  console.log('  Do not over-index on small deltas.')
}

console.log()
console.log('═══════════════════════════════════════════════')
