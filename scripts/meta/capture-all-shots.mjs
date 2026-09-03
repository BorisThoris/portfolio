#!/usr/bin/env node
// Runs every repo's own capture script, so each project photographs itself with
// its own recipe. Repos with no deployment URL are skipped unless you ask for
// local capture explicitly.
//
// Usage:
//   node scripts/meta/capture-all-shots.mjs
//   node scripts/meta/capture-all-shots.mjs --profiles=og,card
//   node scripts/meta/capture-all-shots.mjs --only=bbeats,skyfall
//   node scripts/meta/capture-all-shots.mjs --include-local   # also start dev servers
//
// Playwright comes from this checkout, so no project needs it installed.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

import { repoRegistry, portfolioRoot } from './repo-registry.mjs';

const args = process.argv.slice(2);
const onlyArg = args.find((argument) => argument.startsWith('--only='));
const only = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',').map((value) => value.trim())) : null;
const includeLocal = args.includes('--include-local');
const forwarded = args.filter((argument) => argument.startsWith('--profiles=') || argument.startsWith('--source='));

const results = [];

for (const entry of repoRegistry) {
  if (only && !only.has(entry.slug)) continue;
  const script = path.join(entry.dir, 'scripts', 'capture-project-shots.mjs');
  if (!fs.existsSync(script)) {
    results.push({ slug: entry.slug, ok: false, message: 'capture script not installed' });
    continue;
  }

  const config = await import(pathToFileURL(path.join(entry.dir, 'scripts', 'project-meta.config.mjs')).href)
    .then((module_) => module_.default)
    .catch(() => null);
  const hasDeployment = Boolean(config?.curated?.deploymentUrl);
  if (!hasDeployment && !includeLocal) {
    results.push({ slug: entry.slug, ok: true, message: 'skipped (no deployment URL; --include-local to run its dev server)' });
    continue;
  }

  const run = spawnSync(process.execPath, [script, ...forwarded], {
    cwd: entry.dir,
    encoding: 'utf8',
    env: { ...process.env, PORTFOLIO_ROOT: portfolioRoot },
    timeout: 300000
  });
  const lines = [run.stdout, run.stderr].filter(Boolean).join('').trim().split('\n');
  const summary = lines.filter((line) => /profiles into|FAILED|not found|Skipping/.test(line)).slice(-1)[0] ?? lines.slice(-1)[0] ?? '';
  results.push({ slug: entry.slug, ok: run.status === 0, message: summary.replace(/^\[shots\]\s*/, '').trim() });
}

const width = Math.max(...results.map((row) => row.slug.length));
for (const row of results) console.log((row.ok ? 'ok   ' : 'FAIL ') + row.slug.padEnd(width) + '  ' + row.message);

const failed = results.filter((row) => !row.ok);
console.log('\n' + results.length + ' repos, ' + failed.length + ' failed.');
process.exit(failed.length === 0 ? 0 : 1);
