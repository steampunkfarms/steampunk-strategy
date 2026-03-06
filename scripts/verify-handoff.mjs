#!/usr/bin/env node
// Handoff verification script
// Run after Claude Code completes a handoff to ensure all acceptance criteria are met.
// Usage: node scripts/verify-handoff.mjs [--handoff-name ORCH-101]
// Supports cross-repo handoffs by resolving sibling repo paths.
// Supports both legacy bold-label and heading-based handoff spec formats.
// Enforces 2026-03-06 protocol artifacts (Strategy Session, Cross-Site, Family Planning, Debrief).

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const args = process.argv.slice(2);
const handoffArg = args.indexOf('--handoff-name');
const handoffName = handoffArg !== -1 ? args[handoffArg + 1] : null;

if (!handoffName) {
  console.error('Usage: node scripts/verify-handoff.mjs --handoff-name <HANDOFF_ID>');
  process.exit(1);
}

// Map handoff name to filename: try exact match, derived name, then content scan.
const handoffsDir = path.join(process.cwd(), 'docs', 'handoffs');
let handoffFile = null;

// Try exact filename match first
const exactPath = path.join(handoffsDir, `${handoffName}.md`);
if (fs.existsSync(exactPath)) {
  handoffFile = exactPath;
}

// Try legacy derived name (orchestrator prefix normalization)
if (!handoffFile) {
  const derivedPath = path.join(handoffsDir, `${handoffName.toLowerCase().replace(/^orchestrator-|^orch-/i, 'orchestrator-')}.md`);
  if (fs.existsSync(derivedPath)) {
    handoffFile = derivedPath;
  }
}

// Fall back to content scan
if (!handoffFile) {
  const found = fs.readdirSync(handoffsDir).find(f =>
    f.endsWith('.md') && fs.readFileSync(path.join(handoffsDir, f), 'utf-8').includes(handoffName)
  );
  if (found) {
    handoffFile = path.join(handoffsDir, found);
  }
}

if (!handoffFile) {
  console.error(`❌ Handoff spec not found for ${handoffName} in ${handoffsDir}`);
  process.exit(1);
}

console.log(`📋 Using handoff spec: ${path.basename(handoffFile)}\n`);

const handoffContent = fs.readFileSync(handoffFile, 'utf-8');
const roadmapPath = path.join(process.cwd(), 'docs', 'roadmap.md');
const roadmapContent = fs.readFileSync(roadmapPath, 'utf-8');

// Determine the workspace root (parent of steampunk-strategy)
const workspaceRoot = path.resolve(process.cwd(), '..');

let hasErrors = false;

// --- Section extraction: supports both legacy bold-label and heading-based formats ---

function extractTargetRepos(content) {
  const repos = new Set();
  const repoPattern = /\b(steampunk-[\w-]+|cleanpunk-[\w-]+)\b/g;

  // Legacy: **Target repo(s):** reponame, reponame2 (description)
  const legacyMatch = content.match(/\*\*Target repo(?:\(s\))?:\*\*\s*([^\n]+)/);
  if (legacyMatch) {
    for (const m of legacyMatch[1].matchAll(repoPattern)) repos.add(m[1]);
  }

  // Plural label: **Target repos:** reponame (desc), reponame2 (desc)
  const pluralMatch = content.match(/\*\*Target repos:\*\*\s*([^\n]+)/);
  if (pluralMatch) {
    for (const m of pluralMatch[1].matchAll(repoPattern)) repos.add(m[1]);
  }

  // Heading-based: ## Repos in scope\n- `reponame`\n- reponame
  const headingMatch = content.match(/^##\s+Repos in scope\b[^\n]*\n([\s\S]*?)(?=\n##|\n---)/m);
  if (headingMatch) {
    for (const m of headingMatch[1].matchAll(repoPattern)) repos.add(m[1]);
  }

  // Scan entire content for repo names mentioned in scope/target context
  // (catches table-based and inline references in scope sections)
  const scopeMatch = content.match(/^##\s+Scope\b[^\n]*\n([\s\S]*?)(?=\n##|\n---)/m);
  if (scopeMatch) {
    for (const m of scopeMatch[1].matchAll(repoPattern)) repos.add(m[1]);
  }

  return [...repos];
}

function extractFilesAffected(content) {
  // Legacy: **Files affected:**\n- `path`\n...
  const legacyMatch = content.match(/\*\*Files affected:\*\*\n([\s\S]*?)(?=\n\n|\*\*)/);
  if (legacyMatch) {
    return legacyMatch[1].split('\n').filter(line => line.match(/^\s*[-*]\s+`/));
  }
  // Heading-based: ## Files affected\n- `path`\n...
  const headingMatch = content.match(/^##\s+Files affected\b[^\n]*\n([\s\S]*?)(?=\n##|\n---)/m);
  if (headingMatch) {
    return headingMatch[1].split('\n').filter(line => line.match(/^\s*[-*]\s+`/));
  }
  return [];
}

const targetRepos = extractTargetRepos(handoffContent);
const targetDirs = targetRepos.length > 0
  ? targetRepos.map(r => path.join(workspaceRoot, r)).filter(d => fs.existsSync(d))
  : [process.cwd()];

// Log resolved repos for transparency
if (targetRepos.length > 0) {
  console.log(`📦 Target repos: ${targetRepos.join(', ')}`);
  const missing = targetRepos.filter(r => !fs.existsSync(path.join(workspaceRoot, r)));
  if (missing.length > 0) {
    console.log(`⚠️  Repos not found on disk: ${missing.join(', ')}`);
  }
  console.log('');
}

const filesAffected = extractFilesAffected(handoffContent);

// Check 1: All files exist or are new
console.log('🔍 Checking files...');
filesAffected.forEach(line => {
  const match = line.match(/`([^`]+)`/);
  if (!match) return;
  const file = match[1];
  const fullPath = path.join(workspaceRoot, file);
  const cwdPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    console.log(`  ✅ ${file}`);
  } else if (fs.existsSync(cwdPath)) {
    console.log(`  ✅ ${file}`);
  } else if (line.includes('(new)') || line.includes('(created)') || line.includes('(reference)')) {
    console.log(`  ⚠️  ${file} (marked as new/reference — skipped)`);
  } else if (file.includes('*')) {
    console.log(`  ⏭️  ${file} (glob pattern, skipped)`);
  } else {
    console.log(`  ⚠️  File not found: ${file}`);
  }
});

// Check 2: Prisma schema valid if modified
if (handoffContent.includes('prisma/schema.prisma')) {
  console.log('\n🔍 Checking prisma schema...');
  const schemaDirs = [...new Set([...targetDirs, process.cwd()])];
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
        hasErrors = true;
      }
    }
  }
  if (!schemaChecked) {
    console.log('  ⚠️  No prisma schema found to validate');
  }
}

// Check 3: JSON files are valid
console.log('\n🔍 Checking JSON files...');
const jsonDirs = [...new Set([...targetDirs, process.cwd()])];
jsonDirs.forEach(dir => {
  ['vercel.json', 'package.json', 'tsconfig.json'].forEach(jsonFile => {
    const fullPath = path.join(dir, jsonFile);
    if (fs.existsSync(fullPath)) {
      try {
        JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        console.log(`  ✅ ${path.basename(dir)}/${jsonFile}`);
      } catch (e) {
        console.log(`  ❌ ${path.basename(dir)}/${jsonFile} is invalid JSON`);
        hasErrors = true;
      }
    }
  });
});

// Check 4: Roadmap updated
console.log('\n🔍 Checking roadmap...');
if (roadmapContent.includes('🤖 **2026-')) {
  console.log('  ✅ Roadmap has been updated with completion timestamp');
} else {
  console.log('  ⚠️  Roadmap may not have been updated (no 🤖 timestamp found)');
}
if (roadmapContent.includes(handoffName)) {
  console.log(`  ✅ ${handoffName} found in roadmap`);
} else {
  console.log(`  ⚠️  ${handoffName} not found in roadmap`);
}

// Check 5: Reference doc comments in code
console.log('\n🔍 Checking for reference doc comments...');
const commentScanRoots = ['src', 'app', 'lib'];
const srcDirs = [...new Set([...targetDirs, process.cwd()])]
  .flatMap(d => commentScanRoots.map(root => path.join(d, root)))
  .filter((d, i, arr) => fs.existsSync(d) && arr.indexOf(d) === i);
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

// Check 6: No broken imports (TypeScript compilation)
console.log('\n🔍 Checking for broken imports...');
const tscDirs = [...new Set([...targetDirs, process.cwd()])];
for (const dir of tscDirs) {
  const tsconfig = path.join(dir, 'tsconfig.json');
  if (fs.existsSync(tsconfig)) {
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe', cwd: dir, timeout: 120000 });
      console.log(`  ✅ TypeScript compilation clean (${path.basename(dir)})`);
    } catch (e) {
      const output = (e.stdout || e.stderr || '').toString().slice(0, 2000);
      console.log(`  ❌ TypeScript errors in ${path.basename(dir)}:\n${output}`);
      hasErrors = true;
    }
  }
}

// Check 7: Handoff spec marked complete
console.log('\n🔍 Checking handoff completion status...');
if (handoffContent.match(/COMPLETE|completed/i)) {
  console.log('  ✅ Handoff spec marked as complete');
} else {
  console.log('  ⚠️  Handoff spec may not be marked as complete');
}

// Check 8: 2026-03-06 Protocol Artifact Enforcement
// Checks working spec for required sections when it exists.
console.log('\n🔍 Checking 2026-03-06 protocol artifacts...');
const workingSpecDir = path.join(process.cwd(), 'docs', 'handoffs', '_working');
const workingSpecCandidates = fs.existsSync(workingSpecDir)
  ? fs.readdirSync(workingSpecDir).filter(f => f.includes(handoffName) && f.endsWith('.md'))
  : [];

if (workingSpecCandidates.length > 0) {
  const workingSpecPath = path.join(workingSpecDir, workingSpecCandidates[0]);
  const workingContent = fs.readFileSync(workingSpecPath, 'utf-8');

  // Strategy Session Template answers
  if (workingContent.match(/Strategy Session Template|Protocol Fit|Failure Mode Impact|Operator Burden|Measurable Gain/i)) {
    console.log('  ✅ Strategy Session Template answers found in working spec');
  } else {
    console.log('  ❌ Strategy Session Template answers missing from working spec');
    hasErrors = true;
  }

  // Cross-Site Impact Checklist
  if (workingContent.match(/Cross-Site Impact Checklist|Repos touched/i)) {
    console.log('  ✅ Cross-Site Impact Checklist found in working spec');
  } else {
    console.log('  ❌ Cross-Site Impact Checklist missing from working spec');
    hasErrors = true;
  }

  // Family Planning Protocol gate + reversibility score
  if (workingContent.match(/Family Planning Protocol|Major Initiative Criteria/i)) {
    console.log('  ✅ Family Planning Protocol gate found in working spec');
  } else {
    console.log('  ❌ Family Planning Protocol gate missing from working spec');
    hasErrors = true;
  }

  if (workingContent.match(/Reversibility Score|reversibility.*\d/i)) {
    console.log('  ✅ Reversibility score found in working spec');
  } else {
    console.log('  ❌ Reversibility score missing from working spec');
    hasErrors = true;
  }
} else {
  console.log('  ⚠️  No working spec found for this handoff (skipping artifact checks)');
}

// Risk & Reversibility in handoff spec or prompt context
if (handoffContent.match(/Risk\s*[&+]\s*Reversibility/i)) {
  console.log('  ✅ Risk & Reversibility reference found in handoff spec');
} else {
  console.log('  ⚠️  Risk & Reversibility not found in handoff spec (check prompt context)');
}

// Debrief section after verification pass
if (handoffContent.match(/Debrief|What worked well|What could be improved/i)) {
  console.log('  ✅ Debrief section found in handoff spec');
} else {
  console.log('  ⚠️  Debrief section not found (required post-verification)');
}

// Final summary
console.log('');
if (hasErrors) {
  console.log('❌ Handoff verification found errors. Fix issues and re-run.');
  process.exit(1);
} else {
  console.log('✅ Handoff verification complete! Ready to merge.');
}
