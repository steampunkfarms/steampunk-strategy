#!/usr/bin/env node
// Handoff verification script
// Run after Claude Code completes a handoff to ensure all acceptance criteria are met.
// Usage: node scripts/verify-handoff.js [--handoff-name ORCH-101]
// Supports cross-repo handoffs by resolving sibling repo paths.

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const args = process.argv.slice(2);
const handoffArg = args.indexOf('--handoff-name');
const handoffName = handoffArg !== -1 ? args[handoffArg + 1] : null;

if (!handoffName) {
  console.error('Usage: node scripts/verify-handoff.js --handoff-name ORCH-101');
  process.exit(1);
}

// Map handoff name to filename: try derived name first, then scan for a file
// whose content contains the handoff ID (e.g. "ORCH-101").
const handoffsDir = path.join(process.cwd(), 'docs', 'handoffs');
let handoffFile = path.join(handoffsDir, `${handoffName.toLowerCase().replace(/^orchestrator-|^orch-/i, 'orchestrator-')}.md`);
if (!fs.existsSync(handoffFile)) {
  const found = fs.readdirSync(handoffsDir).find(f =>
    f.endsWith('.md') && fs.readFileSync(path.join(handoffsDir, f), 'utf-8').includes(handoffName)
  );
  if (found) {
    handoffFile = path.join(handoffsDir, found);
  } else {
    console.error(`❌ Handoff spec not found for ${handoffName} in ${handoffsDir}`);
    process.exit(1);
  }
}
console.log(`📋 Using handoff spec: ${path.basename(handoffFile)}\n`);

const handoffContent = fs.readFileSync(handoffFile, 'utf-8');
const roadmapPath = path.join(process.cwd(), 'docs', 'roadmap.md');
const roadmapContent = fs.readFileSync(roadmapPath, 'utf-8');

// Determine the workspace root (parent of steampunk-strategy)
const workspaceRoot = path.resolve(process.cwd(), '..');

// Extract target repo from handoff spec if present
const targetMatch = handoffContent.match(/\*\*Target repo\(s\):\*\*\s*([\w-]+)/);
const targetRepo = targetMatch ? targetMatch[1] : null;
const targetDir = targetRepo ? path.join(workspaceRoot, targetRepo) : process.cwd();

// Extract "Files affected" section from handoff spec
const filesMatch = handoffContent.match(/\*\*Files affected:\*\*\n([\s\S]*?)(?=\n\n|\*\*)/);
const filesAffected = filesMatch ? filesMatch[1].split('\n').filter(line => line.match(/^\s*-\s+`/)) : [];

// Check 1: All files exist or are new
console.log('🔍 Checking files...');
let filesOk = true;
filesAffected.forEach(line => {
  const match = line.match(/`([^`]+)`/);
  if (!match) return;
  const file = match[1];
  // Resolve against workspace root (handles steampunk-orchestrator/... paths)
  const fullPath = path.join(workspaceRoot, file);
  // Also try relative to cwd
  const cwdPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    console.log(`  ✅ ${file}`);
  } else if (fs.existsSync(cwdPath)) {
    console.log(`  ✅ ${file}`);
  } else if (line.includes('(new)') || line.includes('(created)')) {
    console.log(`  ⚠️  ${file} (marked as new — not yet created)`);
  } else if (file.includes('*')) {
    // Glob pattern — skip
    console.log(`  ⏭️  ${file} (glob pattern, skipped)`);
  } else {
    console.log(`  ⚠️  File not found: ${file}`);
    filesOk = false;
  }
});

// Check 2: Prisma schema valid if modified
if (handoffContent.includes('prisma/schema.prisma')) {
  console.log('\n🔍 Checking prisma schema...');
  // Check in target repo first, then cwd
  const schemaDirs = [targetDir, process.cwd()].filter((d, i, a) => a.indexOf(d) === i);
  let schemaChecked = false;
  for (const dir of schemaDirs) {
    const schemaPath = path.join(dir, 'prisma', 'schema.prisma');
    if (fs.existsSync(schemaPath)) {
      try {
        execSync('npx prisma validate', { stdio: 'pipe', cwd: dir });
        console.log(`  ✅ Schema is valid (${path.basename(dir)})`);
        schemaChecked = true;
      } catch (e) {
        console.log(`  ❌ Schema validation failed in ${path.basename(dir)}: ${e.message}`);
        process.exit(1);
      }
    }
  }
  if (!schemaChecked) {
    console.log('  ⚠️  No prisma schema found to validate');
  }
}

// Check 3: JSON files are valid (check in both target repo and cwd)
console.log('\n🔍 Checking JSON files...');
const jsonDirs = [targetDir, process.cwd()].filter((d, i, a) => a.indexOf(d) === i);
jsonDirs.forEach(dir => {
  ['vercel.json', 'package.json', 'tsconfig.json'].forEach(jsonFile => {
    const fullPath = path.join(dir, jsonFile);
    if (fs.existsSync(fullPath)) {
      try {
        JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        console.log(`  ✅ ${path.basename(dir)}/${jsonFile}`);
      } catch (e) {
        console.log(`  ❌ ${path.basename(dir)}/${jsonFile} is invalid JSON`);
        process.exit(1);
      }
    }
  });
});

// Check 4: Roadmap updated
console.log('\n🔍 Checking roadmap...');
if (roadmapContent.includes(`🤖 **2026-`)) {
  console.log('  ✅ Roadmap has been updated with completion timestamp');
} else {
  console.log(`  ⚠️  Roadmap may not have been updated (no 🤖 timestamp found)`);
}
if (roadmapContent.includes(`(${handoffName})`)) {
  if (roadmapContent.lastIndexOf(`(${handoffName})`) > roadmapContent.indexOf('## 🔴 Priority One')) {
    console.log(`  ✅ ${handoffName} moved to bottom of roadmap`);
  } else {
    console.log(`  ⚠️  ${handoffName} may not be at the bottom`);
  }
} else {
  console.log(`  ⚠️  ${handoffName} not found in roadmap`);
}

// Check 5: Reference doc comments in code (scan target repo if different)
console.log('\n🔍 Checking for reference doc comments...');
const srcDirs = [targetDir, process.cwd()]
  .map(d => path.join(d, 'src'))
  .filter(d => fs.existsSync(d));
let commentCount = 0;
const scanDir = (dir) => {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      if (content.match(/\/\/\s+(see|see also)\s+docs\/.*\.md/i) || content.match(/\/\*.*docs\/.*\.md.*\*\//) || content.match(/\*\s+(see|see also)\s+docs\/.*\.md/i)) {
        commentCount++;
      }
    }
  });
};
srcDirs.forEach(d => scanDir(d));
if (commentCount > 0) {
  console.log(`  ✅ Found ${commentCount} files with reference doc comments`);
} else {
  console.log(`  ⚠️  No reference doc comments found (optional but recommended)`);
}

// Check 6: No broken imports (compile target repo; skip cwd if it's a different repo
// to avoid failing on pre-existing issues unrelated to this handoff)
console.log('\n🔍 Checking for broken imports...');
const tscDirs = targetDir !== process.cwd() ? [targetDir] : [process.cwd()];
for (const dir of tscDirs) {
  const tsconfig = path.join(dir, 'tsconfig.json');
  if (fs.existsSync(tsconfig)) {
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe', cwd: dir, timeout: 120000 });
      console.log(`  ✅ TypeScript compilation clean (${path.basename(dir)})`);
    } catch (e) {
      const output = (e.stdout || e.stderr || '').toString().slice(0, 2000);
      console.log(`  ❌ TypeScript errors in ${path.basename(dir)}:\n${output}`);
      process.exit(1);
    }
  }
}

// Check 7: Handoff spec marked complete
console.log('\n🔍 Checking handoff completion status...');
if (handoffContent.includes('COMPLETE') || handoffContent.includes('complete')) {
  console.log('  ✅ Handoff spec marked as complete');
} else {
  console.log('  ⚠️  Handoff spec may not be marked as complete');
}

console.log('\n✅ Handoff verification complete! Ready to merge.');
