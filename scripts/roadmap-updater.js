#!/usr/bin/env node
// simple script to move completed roadmap items to bottom with summary
// usage: node scripts/roadmap-updater.js "(ORCH-101) central cron registry" "Added central registry to Orchestrator" 

import fs from 'fs';
import path from 'path';

const roadmapPath = path.join(process.cwd(), 'docs', 'roadmap.md');
const [,, itemTag, summary] = process.argv;
if (!itemTag || !summary) {
  console.error('Usage: node roadmap-updater.js <item-tag> <summary>');
  process.exit(1);
}

let content = fs.readFileSync(roadmapPath, 'utf-8').split('\n');
let completedLineIndex = content.findIndex(line => line.includes(itemTag));
if (completedLineIndex === -1) {
  console.error('Item not found:', itemTag);
  process.exit(1);
}
let line = content[completedLineIndex];
// remove the checkbox prefix if present
line = line.replace(/^- \[.\] ?/, '- ');
const timestamp = new Date().toISOString().split('T')[0];
const summaryLine = `- 🤖 **${timestamp}:** ${summary}`;
// remove the original line
content.splice(completedLineIndex, 1);
// append summary and the original at bottom
content.push(summaryLine);
content.push(line);
fs.writeFileSync(roadmapPath, content.join('\n'));
console.log('Roadmap updated.');
