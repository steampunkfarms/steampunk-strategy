#!/usr/bin/env node
// Protocol health summary — reads docs/protocol-metrics.jsonl and prints aggregate stats.
// Usage: node scripts/protocol-health-summary.mjs [--month YYYY-MM]
// If --month is omitted, summarizes all recorded metrics.
// see docs/tardis-protocol-health-dashboard-spec.md#phase-a

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const monthIdx = args.indexOf('--month');
const monthFilter = monthIdx !== -1 ? args[monthIdx + 1] : null;

const metricsPath = path.join(process.cwd(), 'docs', 'protocol-metrics.jsonl');

if (!fs.existsSync(metricsPath)) {
  console.error('No metrics file found at docs/protocol-metrics.jsonl');
  process.exit(1);
}

const lines = fs.readFileSync(metricsPath, 'utf-8')
  .split('\n')
  .filter(line => line.trim().length > 0);

if (lines.length === 0) {
  console.log('No metric events recorded yet.');
  process.exit(0);
}

let events = lines.map((line, i) => {
  try {
    return JSON.parse(line);
  } catch (e) {
    console.warn(`Warning: invalid JSON on line ${i + 1}, skipping`);
    return null;
  }
}).filter(Boolean);

if (monthFilter) {
  events = events.filter(e => e.timestamp && e.timestamp.startsWith(monthFilter));
  if (events.length === 0) {
    console.log(`No metric events found for ${monthFilter}.`);
    process.exit(0);
  }
}

const total = events.length;
const passed = events.filter(e => e.passed).length;
const failed = total - passed;

const sum = (key) => events.reduce((acc, e) => acc + (e[key] || 0), 0);
const avg = (key) => total > 0 ? (sum(key) / total).toFixed(1) : 0;

const totalChecksRun = sum('checksRun');
const totalChecksPassed = sum('checksPassed');
const totalChecksWarned = sum('checksWarned');
const totalChecksFailed = sum('checksFailed');
const totalTscErrors = sum('tscErrorCount');
const totalSatelliteStale = sum('satelliteStale');

const modeCount = { mapped: 0, lean: 0 };
events.forEach(e => { if (e.mode) modeCount[e.mode] = (modeCount[e.mode] || 0) + 1; });

const period = monthFilter || 'all time';
const passRate = total > 0 ? ((passed / total) * 100).toFixed(0) : 0;

console.log(`\n📊 Protocol Health Summary — ${period}`);
console.log('═'.repeat(50));
console.log(`Handoffs completed:    ${total}`);
console.log(`Pass rate:             ${passed}/${total} (${passRate}%)`);
console.log('');
console.log(`Total checks run:      ${totalChecksRun}`);
console.log(`  Passed:              ${totalChecksPassed}`);
console.log(`  Warned:              ${totalChecksWarned}`);
console.log(`  Failed:              ${totalChecksFailed}`);
console.log('');
console.log(`TSC errors (total):    ${totalTscErrors}`);
console.log(`Satellite stale (total): ${totalSatelliteStale}`);
console.log('');
console.log(`Repos checked (avg):   ${avg('reposChecked')}`);
console.log(`Files listed (avg):    ${avg('filesListed')}`);
console.log('');
console.log(`Modes:                 mapped=${modeCount.mapped}, lean=${modeCount.lean}`);
console.log('═'.repeat(50));

// List individual handoffs
console.log('\nHandoff Details:');
events.forEach(e => {
  const status = e.passed ? '✅' : '❌';
  const ts = e.timestamp ? e.timestamp.slice(0, 10) : '??';
  console.log(`  ${status} ${ts} ${e.handoffId} — ${e.checksRun} checks (${e.checksPassed}✓ ${e.checksWarned}⚠ ${e.checksFailed}✗)`);
});
console.log('');
