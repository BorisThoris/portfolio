#!/usr/bin/env node
// Pulls every repo's project.meta.json back into the portfolio data files.
//
// Once a repo owns its metadata, this is the direction data flows:
//   repo/project.meta.json  ->  portfolio/src/project-data.json
//                           ->  portfolio/src/repo-analysis.json
//
// Runs read-only by default so it can be used as a drift check.
//
// Usage:
//   node scripts/meta/sync-project-meta.mjs             # report drift only
//   node scripts/meta/sync-project-meta.mjs --write      # apply to portfolio data
//   node scripts/meta/sync-project-meta.mjs --write --add-new
//                                                       # also add unlisted projects

import fs from 'node:fs';
import path from 'node:path';

import { repoRegistry, portfolioRoot, hostedOnlyProjects } from './repo-registry.mjs';

const args = process.argv.slice(2);
const write = args.includes('--write');
const addNew = args.includes('--add-new');

const projectDataPath = path.join(portfolioRoot, 'src', 'project-data.json');
const analysisPath = path.join(portfolioRoot, 'src', 'repo-analysis.json');
const projectData = readJson(projectDataPath) ?? [];
const analysis = readJson(analysisPath) ?? [];

const metas = [];
for (const entry of repoRegistry) {
  const metaPath = path.join(entry.dir, 'project.meta.json');
  const meta = readJson(metaPath);
  if (!meta) continue;
  metas.push({ entry, meta, metaPath });
}

const changes = [];
const nextProjectData = projectData.map((record) => {
  const found = metas.find((item) => item.meta.identity?.slug === record.slug);
  if (!found) return record;
  const merged = { ...record, ...projectRecordFrom(found) };
  // A card image that still resolves stays as curated; only broken references
  // are repointed at the latest capture.
  if (record.screenshot && publicFileExists(record.screenshot)) merged.screenshot = record.screenshot;
  diffRecord('project-data', record.slug, record, merged);
  return merged;
});

const nextAnalysis = analysis.map((record) => {
  const found = metas.find((item) => item.meta.identity?.slug === record.slug);
  if (!found) return record;
  const merged = { ...record, ...analysisRecordFrom(found) };
  diffRecord('repo-analysis', record.slug, record, merged);
  return merged;
});

const knownProjectSlugs = new Set(projectData.map((record) => record.slug));
const knownAnalysisSlugs = new Set(analysis.map((record) => record.slug));
const newProjects = metas.filter((item) =>
  !knownProjectSlugs.has(item.meta.identity.slug) &&
  item.meta.identity.showcaseTier !== 'excluded');
const newAnalyses = metas.filter((item) => !knownAnalysisSlugs.has(item.meta.identity.slug));

if (addNew) {
  for (const item of newProjects) {
    nextProjectData.push(projectRecordFrom(item));
    changes.push('project-data  ' + item.meta.identity.slug + '  added');
  }
  for (const item of newAnalyses) {
    nextAnalysis.push(analysisRecordFrom(item));
    changes.push('repo-analysis ' + item.meta.identity.slug + '  added');
  }
}

for (const change of changes) console.log(change);
if (changes.length === 0) console.log('No drift between repo metadata and portfolio data.');

if (!addNew) {
  if (newProjects.length > 0) {
    console.log('\nProjects with metadata but no portfolio entry (use --add-new to list them on the site):');
    for (const item of newProjects) console.log('  ' + item.meta.identity.slug + '  ' + item.meta.identity.title);
  }
  if (newAnalyses.length > 0) {
    console.log('\nRepos with metadata but no analysis row (use --add-new):');
    for (const item of newAnalyses) console.log('  ' + item.meta.identity.slug);
  }
}

const missingMeta = repoRegistry.filter((entry) => !metas.some((item) => item.entry.slug === entry.slug));
if (missingMeta.length > 0) {
  console.log('\nRegistered repos without project.meta.json:');
  for (const entry of missingMeta) console.log('  ' + entry.slug + '  ' + entry.dir);
}

const stalePaths = metas.filter((item) => {
  const record = projectData.find((candidate) => candidate.slug === item.meta.identity.slug);
  if (!record || !path.isAbsolute(record.repoPath)) return false;
  return path.resolve(record.repoPath).toLowerCase() !== path.resolve(item.entry.dir).toLowerCase();
});
if (stalePaths.length > 0) {
  console.log('\nPortfolio repoPath does not match the repo the metadata came from:');
  for (const item of stalePaths) {
    const record = projectData.find((candidate) => candidate.slug === item.meta.identity.slug);
    console.log('  ' + item.meta.identity.slug + '\n    portfolio: ' + record.repoPath + '\n    registry:  ' + item.entry.dir);
  }
}

if (hostedOnlyProjects.length > 0) {
  console.log('\nHosted-only projects (no local repo, portfolio data is authoritative): ' + hostedOnlyProjects.join(', '));
}

if (write) {
  fs.writeFileSync(projectDataPath, JSON.stringify(nextProjectData, null, 2) + '\n');
  fs.writeFileSync(analysisPath, JSON.stringify(nextAnalysis, null, 2) + '\n');
  console.log('\nWrote src/project-data.json and src/repo-analysis.json.');
} else {
  console.log('\nRead-only run. Re-run with --write to apply.');
}

// ------------------------------------------------------------------ mapping

function projectRecordFrom({ entry, meta }) {
  const identity = meta.identity ?? {};
  const runtime = meta.runtime ?? {};
  const links = meta.links ?? {};
  return pruneEmpty({
    slug: identity.slug,
    title: identity.title,
    subtitle: identity.subtitle,
    description: identity.description,
    repoPath: entry.dir,
    localUrl: links.localUrl,
    deploymentUrl: links.deploymentUrl,
    buildCommand: runtime.buildCommand,
    buildOutput: runtime.buildOutput,
    serveBasePath: runtime.serveBasePath,
    buildCwd: runtime.buildCwd,
    fallbackCommand: runtime.fallbackCommand,
    fallbackCwd: runtime.fallbackCwd,
    fallbackEnv: runtime.fallbackEnv,
    runCommand: runtime.runCommand,
    screenshot: meta.media?.primary,
    tags: identity.tags,
    accent: identity.accent
  });
}

function analysisRecordFrom({ meta }) {
  const identity = meta.identity ?? {};
  const scores = meta.scores ?? {};
  return pruneEmpty({
    slug: identity.slug,
    repoName: identity.repoName,
    showcaseTier: identity.showcaseTier ?? 'more',
    showcaseOrder: identity.showcaseOrder,
    priorityScore: scores.priorityScore ?? 50,
    demoabilityScore: scores.demoabilityScore ?? 50,
    depthScore: scores.depthScore ?? 50,
    polishScore: scores.polishScore ?? 50,
    uniquenessScore: scores.uniquenessScore ?? 50,
    maintenanceScore: scores.maintenanceScore ?? 50,
    analysisNotes: meta.analysisNotes ?? '',
    duplicateOf: identity.duplicateOf,
    excludedReason: identity.excludedReason
  });
}

function diffRecord(file, slug, before, after) {
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const left = JSON.stringify(before[key]);
    const right = JSON.stringify(after[key]);
    if (left === right) continue;
    changes.push(file.padEnd(13) + ' ' + slug + '  ' + key + ': ' + (left ?? 'unset') + ' -> ' + (right ?? 'unset'));
  }
}

// ------------------------------------------------------------------- helpers

function pruneEmpty(value) {
  const result = {};
  for (const [key, entry] of Object.entries(value)) {
    if (entry === undefined || entry === null) continue;
    if (typeof entry === 'string' && entry === '') continue;
    if (Array.isArray(entry) && entry.length === 0) continue;
    result[key] = entry;
  }
  return result;
}

function publicFileExists(publicPath) {
  if (!publicPath.startsWith('/')) return false;
  return fs.existsSync(path.join(portfolioRoot, 'public', ...publicPath.slice(1).split('/')));
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}
