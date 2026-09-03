#!/usr/bin/env node
// Runs every repo's own metadata generator.
//
// Each repo regenerates itself with its own script and its own config - this
// only fans out and collects the results.
//
// Usage:
//   node scripts/meta/regen-all-meta.mjs
//   node scripts/meta/regen-all-meta.mjs --check        # fail on stale metadata
//   node scripts/meta/regen-all-meta.mjs --copy-media   # also copy shots into repos
//   node scripts/meta/regen-all-meta.mjs --only=bbeats,skyfall

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { repoRegistry } from './repo-registry.mjs';

const args = process.argv.slice(2);
const onlyArg = args.find((arg) => arg.startsWith('--only='));
const only = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',').map((value) => value.trim())) : null;
const forwarded = args.filter((arg) => arg === '--check' || arg === '--copy-media');

const results = [];

for (const entry of repoRegistry) {
  if (only && !only.has(entry.slug)) continue;
  const generator = path.join(entry.dir, 'scripts', 'generate-project-meta.mjs');
  if (!fs.existsSync(generator)) {
    results.push({ slug: entry.slug, ok: false, message: 'generator not installed (run install-project-meta.mjs)' });
    continue;
  }

  const run = spawnSync(process.execPath, [generator, ...forwarded], {
    cwd: entry.dir,
    encoding: 'utf8'
  });
  const output = [run.stdout, run.stderr].filter(Boolean).join('').trim().split('\n').pop() ?? '';
  results.push({ slug: entry.slug, ok: run.status === 0, message: output.replace(/^\[project-meta\]\s*/, '') });
}

const width = Math.max(...results.map((row) => row.slug.length));
for (const row of results) {
  console.log((row.ok ? 'ok   ' : 'FAIL ') + row.slug.padEnd(width) + '  ' + row.message);
}

const failed = results.filter((row) => !row.ok);
console.log('\n' + results.length + ' repos, ' + failed.length + ' failed.');
process.exit(failed.length === 0 ? 0 : 1);
