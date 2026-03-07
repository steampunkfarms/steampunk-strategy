#!/usr/bin/env node
// Moves completed roadmap items from roadmap.md to roadmap-archive.md with summary.
// Also searches roadmap-deferred.md if item not found in roadmap.md.
// usage: node scripts/roadmap-updater.js "(ORCH-101) central cron registry" "Added central registry to Orchestrator"

import fs from 'fs';
import path from 'path';

const docsDir = path.join(process.cwd(), 'docs');
const roadmapPath = path.join(docsDir, 'roadmap.md');
const deferredPath = path.join(docsDir, 'roadmap-deferred.md');
const archivePath = path.join(docsDir, 'roadmap-archive.md');

const [,, itemTag, summary] = process.argv;
if (!itemTag || !summary) {
  console.error('Usage: node roadmap-updater.js <item-tag> <summary>');
  process.exit(1);
}

// Find the item in roadmap.md or roadmap-deferred.md
let sourceFile = null;
let content = null;
let completedLineIndex = -1;

for (const file of [roadmapPath, deferredPath]) {
  if (!fs.existsSync(file)) continue;
  const lines = fs.readFileSync(file, 'utf-8').split('\n');
  const idx = lines.findIndex(line => line.includes(itemTag));
  if (idx !== -1) {
    sourceFile = file;
    content = lines;
    completedLineIndex = idx;
    break;
  }
}

if (completedLineIndex === -1) {
  console.error('Item not found:', itemTag);
  process.exit(1);
}

let line = content[completedLineIndex];
// remove the checkbox prefix if present
line = line.replace(/^- \[.\] ?/, '- ');
const timestamp = new Date().toISOString().split('T')[0];
const summaryLine = `- 🤖 **${timestamp}:** ${summary}`;

// remove the original line from source file
content.splice(completedLineIndex, 1);
fs.writeFileSync(sourceFile, content.join('\n'));

// append to archive
let archive = fs.existsSync(archivePath) ? fs.readFileSync(archivePath, 'utf-8') : '';
if (!archive.endsWith('\n')) archive += '\n';
archive += summaryLine + '\n' + line + '\n';
fs.writeFileSync(archivePath, archive);

console.log(`Roadmap updated: moved from ${path.basename(sourceFile)} to roadmap-archive.md`);
