#!/usr/bin/env node

/**
 * Pre-publish checklist for basecred-sdk
 *
 * Validates:
 * 1. Tests pass
 * 2. TypeScript compiles
 * 3. CHANGELOG has entry for current version
 * 4. README status matches current version
 * 5. Build succeeds
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function log(color, symbol, message) {
  console.log(`${color}${symbol}${RESET} ${message}`);
}

function pass(message) {
  log(GREEN, '✓', message);
}

function fail(message) {
  log(RED, '✗', message);
  process.exit(1);
}

function warn(message) {
  log(YELLOW, '!', message);
}

function run(cmd, description) {
  try {
    execSync(cmd, { cwd: ROOT, stdio: 'pipe' });
    pass(description);
  } catch (error) {
    fail(`${description}\n  ${error.message}`);
  }
}

console.log('\nPre-publish checklist\n');

// 1. Get version from package.json
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
const version = pkg.version;
console.log(`Version: ${version}\n`);

// 2. Run tests
run('npm run test', 'Tests pass');

// 3. Run typecheck
run('npm run typecheck', 'TypeScript compiles');

// 4. Check CHANGELOG has entry for current version
const changelog = readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf-8');
if (changelog.includes(`[${version}]`)) {
  pass(`CHANGELOG has entry for v${version}`);
} else {
  fail(`CHANGELOG missing entry for v${version}`);
}

// 5. Check README status matches version
const readme = readFileSync(join(ROOT, 'README.md'), 'utf-8');
if (readme.includes(`**v${version}`)) {
  pass(`README status matches v${version}`);
} else {
  warn(`README status may not match v${version} — verify manually`);
}

// 6. Build
run('npm run build', 'Build succeeds');

console.log(`\n${GREEN}Ready to publish v${version}${RESET}\n`);
