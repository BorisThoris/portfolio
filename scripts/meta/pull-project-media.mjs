#!/usr/bin/env node
// Pulls every deployed repo's own screenshots and project.meta.json from GitHub
// into this checkout, so the portfolio's cards show what each project last
// photographed of itself (each repo refreshes project-media/ after every
// deployment, see template/project-meta-refresh.yml).
//
//   <repo>@<branch>/project-media/{card,desktop,mobile,full,og}.jpg
//       -> public/project-shots/<slug>/latest/
//   <repo>@<branch>/project.meta.json
//       -> <mirror>/<slug>/project.meta.json   (for sync-project-meta.mjs)
//
// Usage:
//   node scripts/meta/pull-project-media.mjs                 # all deployed repos
//   node scripts/meta/pull-project-media.mjs --only=bbeats
//   node scripts/meta/pull-project-media.mjs --mirror=.meta-mirror
//
// GITHUB_TOKEN (or PORTFOLIO_SYNC_TOKEN) is needed for private repos and lifts
// the anonymous rate limit; public repos work without one.

import fs from 'node:fs';
import path from 'node:path';

import { repoRegistry, portfolioRoot } from './repo-registry.mjs';

const args = process.argv.slice(2);
const onlyArg = args.find((argument) => argument.startsWith('--only='));
const only = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',').map((value) => value.trim())) : null;
const mirrorArg = args.find((argument) => argument.startsWith('--mirror='));
const mirrorDir = path.resolve(portfolioRoot, mirrorArg ? mirrorArg.slice('--mirror='.length) : '.meta-mirror');
const token = process.env.PORTFOLIO_SYNC_TOKEN || process.env.GITHUB_TOKEN || '';

const PROFILES = ['card', 'desktop', 'mobile', 'full', 'og'];
const results = [];

for (const entry of repoRegistry) {
  if (only && !only.has(entry.slug)) continue;
  if (!entry.github || !entry.branch) continue;

  const shotsDir = path.join(portfolioRoot, 'public', 'project-shots', entry.slug, 'latest');
  const metaDir = path.join(mirrorDir, entry.slug);
  fs.mkdirSync(shotsDir, { recursive: true });
  fs.mkdirSync(metaDir, { recursive: true });

  const changed = [];
  const missing = [];
  let failed = null;

  try {
    const capture = await fetchJson(entry, 'project-media/capture.json');
    for (const profile of PROFILES) {
      const bytes = await fetchBytes(entry, 'project-media/' + profile + '.jpg');
      if (!bytes) {
        missing.push(profile);
        continue;
      }
      if (writeIfDifferent(path.join(shotsDir, profile + '.jpg'), bytes)) changed.push(profile + '.jpg');
    }
    if (capture) {
      const stamp = JSON.stringify({ slug: entry.slug, source: entry.github + '@' + entry.branch, capturedAt: capture.capturedAt, url: capture.url }, null, 2) + '\n';
      if (writeIfDifferent(path.join(shotsDir, 'source.json'), Buffer.from(stamp))) changed.push('source.json');
    }
    const meta = await fetchBytes(entry, 'project.meta.json');
    if (meta) fs.writeFileSync(path.join(metaDir, 'project.meta.json'), meta);
    else missing.push('project.meta.json');

    // The videos stay on the project's own deployment (the page streams them
    // from there); only the poster frames come here, for the cards.
    const trailers = await fetchJson(entry, 'project-media/trailers.json');
    for (const item of trailers?.items ?? []) {
      if (!item.poster) continue;
      const bytes = await fetchBytes(entry, item.poster);
      if (!bytes) continue;
      const target = path.join(shotsDir, 'trailers', item.id + '.jpg');
      fs.mkdirSync(path.dirname(target), { recursive: true });
      if (writeIfDifferent(target, bytes)) changed.push('trailers/' + item.id + '.jpg');
    }
  } catch (error) {
    failed = String(error.message).split('\n')[0];
  }

  results.push({
    slug: entry.slug,
    ok: !failed,
    message: failed ?? ((changed.length > 0 ? 'updated ' + changed.join(', ') : 'unchanged') + (missing.length > 0 ? ' (missing: ' + missing.join(', ') + ')' : ''))
  });
}

const width = Math.max(...results.map((row) => row.slug.length));
for (const row of results) console.log((row.ok ? 'ok   ' : 'FAIL ') + row.slug.padEnd(width) + '  ' + row.message);
const failed = results.filter((row) => !row.ok);
console.log('\n' + results.length + ' repos, ' + failed.length + ' failed. Metadata mirrored into ' + path.relative(portfolioRoot, mirrorDir) + '/');
process.exit(failed.length === 0 ? 0 : 1);

// ------------------------------------------------------------------ helpers

async function fetchBytes(entry, filePath) {
  // The contents API serves raw bytes for public and private repos alike; raw.githubusercontent
  // needs no token for public ones, so it is the fallback when the API is rate-limited.
  const apiUrl = 'https://api.github.com/repos/' + entry.github + '/contents/' + filePath + '?ref=' + encodeURIComponent(entry.branch);
  const headers = { Accept: 'application/vnd.github.raw', 'User-Agent': 'portfolio-pull-project-media' };
  if (token) headers.Authorization = 'Bearer ' + token;
  let response = await fetch(apiUrl, { headers });
  if (response.status === 404) return null;
  if (!response.ok && !token) {
    response = await fetch('https://raw.githubusercontent.com/' + entry.github + '/' + entry.branch + '/' + filePath, {
      headers: { 'User-Agent': headers['User-Agent'] }
    });
    if (response.status === 404) return null;
  }
  if (!response.ok) throw new Error(entry.github + ' ' + filePath + ': HTTP ' + response.status);
  return Buffer.from(await response.arrayBuffer());
}

async function fetchJson(entry, filePath) {
  const bytes = await fetchBytes(entry, filePath);
  if (!bytes) return null;
  try {
    return JSON.parse(bytes.toString('utf8'));
  } catch {
    return null;
  }
}

function writeIfDifferent(target, bytes) {
  if (fs.existsSync(target) && fs.readFileSync(target).equals(bytes)) return false;
  fs.writeFileSync(target, bytes);
  return true;
}
