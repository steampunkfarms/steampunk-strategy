#!/usr/bin/env node
// check-vercel-env.js
//
// Goal:
// - Pull decrypted Vercel environment variables for a project.
// - Parse pulled .env files line-by-line (KEY=value format).
// - Detect values that end with carriage return (\r).
// - Print findings, or "All env vars clean." when none are found.
//
// Usage:
//   node scripts/check-vercel-env.js --project steampunk-strategy
//
// Idempotency and safety:
// - This script does not mutate Vercel state (read-only pull operations only).
// - Temp files are created for parsing and always deleted afterward.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

function parseArgs(argv) {
  const parsed = { project: null, help: false };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === '--help' || token === '-h') {
      parsed.help = true;
      continue;
    }

    if (token === '--project') {
      parsed.project = argv[i + 1] || null;
      i += 1;
    }
  }

  return parsed;
}

function printUsage() {
  console.log('Usage: node scripts/check-vercel-env.js --project <project-name>');
}

function resolveProjectDir(projectName) {
  // We support running this script either from:
  // - steampunk-strategy (current repo)
  // - monorepo root (with sibling folders)
  const cwd = process.cwd();
  const candidates = [
    path.resolve(cwd),
    path.resolve(cwd, projectName),
    path.resolve(cwd, '..', projectName),
  ];

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    if (!fs.statSync(candidate).isDirectory()) continue;
    if (path.basename(candidate) === projectName) return candidate;
  }

  throw new Error(
    `Could not find local directory for project "${projectName}". ` +
    'Run from the project folder or monorepo root with that sibling repo present.'
  );
}

function runVercel(projectDir, args) {
  // Vercel CLI 50.x env commands are project-context aware via --cwd.
  const fullArgs = ['--cwd', projectDir, ...args];

  const result = spawnSync('vercel', fullArgs, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.error) {
    if (result.error.code === 'ENOENT') {
      throw new Error('Vercel CLI not found. Install with: npm i -g vercel');
    }
    throw new Error(`Failed to execute Vercel CLI: ${result.error.message}`);
  }

  if (result.status !== 0) {
    const combined = `${(result.stderr || '').trim()}\n${(result.stdout || '').trim()}`.trim();
    const lower = combined.toLowerCase();

    if (
      lower.includes('not logged in') ||
      lower.includes('please login') ||
      lower.includes('no existing credentials') ||
      lower.includes('authentication') ||
      lower.includes('token')
    ) {
      throw new Error(`Vercel auth error. Run \`vercel login\` (or set VERCEL_TOKEN), then retry.\n${combined}`);
    }

    throw new Error(`Vercel CLI command failed: vercel ${fullArgs.join(' ')}\n${combined}`);
  }

  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

function parseEnvFileLineByLine(filePath, environment) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to read pulled env file for ${environment}: ${error.message}`);
  }

  const rows = [];
  const lines = content.split('\n');

  for (let lineNumber = 0; lineNumber < lines.length; lineNumber += 1) {
    const rawLine = lines[lineNumber];

    // Skip empty and comment lines in .env format.
    if (!rawLine || rawLine.trim().length === 0 || rawLine.trim().startsWith('#')) {
      continue;
    }

    // Parse KEY=value strictly at first '=' to preserve values containing '='.
    const eqIndex = rawLine.indexOf('=');
    if (eqIndex === -1) {
      throw new Error(
        `Invalid .env line while parsing ${environment} at line ${lineNumber + 1}: ${rawLine}`
      );
    }

    const key = rawLine.slice(0, eqIndex).trim();
    const value = rawLine.slice(eqIndex + 1);

    if (!key) {
      throw new Error(
        `Invalid .env key while parsing ${environment} at line ${lineNumber + 1}: ${rawLine}`
      );
    }

    rows.push({ key, value, environment });
  }

  return rows;
}

function main() {
  const { project, help } = parseArgs(process.argv.slice(2));

  if (help) {
    printUsage();
    process.exit(0);
  }

  if (!project) {
    printUsage();
    process.exit(1);
  }

  const projectDir = resolveProjectDir(project);
  const environments = ['development', 'preview', 'production'];

  // Temp folder holds decrypted secrets briefly; always cleanup in finally.
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vercel-env-check-'));

  try {
    const parsedRows = [];

    // Pull each Vercel environment to ensure we check all variables, not just development.
    for (const envName of environments) {
      const envFilePath = path.join(tempDir, `.env.${envName}.local`);

      runVercel(projectDir, [
        'env',
        'pull',
        envFilePath,
        '--environment',
        envName,
        '--yes',
      ]);

      if (!fs.existsSync(envFilePath)) {
        throw new Error(`Expected pulled env file not found for ${envName}: ${envFilePath}`);
      }

      const rows = parseEnvFileLineByLine(envFilePath, envName);
      parsedRows.push(...rows);
    }

    // Identify values that end with carriage return.
    const offenders = parsedRows.filter((row) => row.value.endsWith('\r'));

    if (offenders.length === 0) {
      console.log('All env vars clean.');
      return;
    }

    // If the same key appears in multiple environments, print each environment explicitly.
    for (const row of offenders) {
      console.log(`${row.key} (${row.environment}): has trailing \\r`);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  } finally {
    // Best-effort cleanup of decrypted secret files.
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // No-op on cleanup failure.
    }
  }
}

main();
