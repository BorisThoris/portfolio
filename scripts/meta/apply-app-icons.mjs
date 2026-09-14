#!/usr/bin/env node
// Runs every repo's own icon script, so each project renders its favicon,
// Apple icon, PWA icons and web manifest from its own source SVG.
//
// Usage:
//   node scripts/meta/apply-app-icons.mjs
//   node scripts/meta/apply-app-icons.mjs --check
//   node scripts/meta/apply-app-icons.mjs --only=bbeats
//
// Playwright comes from this checkout, so no project needs it installed.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { repoRegistry, portfolioRoot } from './repo-registry.mjs';

const args = process.argv.slice(2);
const onlyArg = args.find((argument) => argument.startsWith('--only='));
const only = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',').map((value) => value.trim())) : null;
const forwarded = args.filter((argument) => argument === '--check');

const results = [];

for (const entry of repoRegistry) {
  if (only && !only.has(entry.slug)) continue;
  const script = path.join(entry.dir, 'scripts', 'generate-app-icons.mjs');
  if (!fs.existsSync(script)) {
    results.push({ slug: entry.slug, ok: false, message: 'icon script not installed' });
    continue;
  }

  const run = spawnSync(process.execPath, [script, ...forwarded], {
    cwd: entry.dir,
    encoding: 'utf8',
    env: { ...process.env, PORTFOLIO_ROOT: portfolioRoot },
    timeout: 120000
  });
  const lines = [run.stdout, run.stderr].filter(Boolean).join('').trim().split('\n').filter(Boolean);
  const message = lines
    .map((line) => line.replace(/^\[icons\]\s*/, '').replace(new RegExp('^' + entry.slug + ':\\s*'), ''))
    .join(' | ');
  results.push({ slug: entry.slug, ok: run.status === 0, message });
}

const width = Math.max(...results.map((row) => row.slug.length));
for (const row of results) console.log((row.ok ? 'ok   ' : 'FAIL ') + row.slug.padEnd(width) + '  ' + row.message);

const failed = results.filter((row) => !row.ok);
console.log('\n' + results.length + ' repos, ' + failed.length + ' failed.');
process.exit(failed.length === 0 ? 0 : 1);
