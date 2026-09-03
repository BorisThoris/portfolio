#!/usr/bin/env node
// Installs the project metadata toolkit into every repo listed in
// scripts/meta/repo-registry.mjs.
//
// Each repo receives:
//   scripts/project-meta.config.mjs   unique to that repo (written once)
//   scripts/generate-project-meta.mjs the shared generator (kept in sync)
//   scripts/project.meta.schema.json  the schema (kept in sync)
//   package.json scripts: meta, meta:check
//
// Curated fields for repos the portfolio already lists are read out of
// src/project-data.json, src/repo-analysis.json and
// scripts/project-capture.config.mjs so there is exactly one source of truth at
// install time. After installation the repo's own config owns those fields;
// scripts/meta/sync-project-meta.mjs pushes them back into the portfolio.
//
// Usage:
//   node scripts/meta/install-project-meta.mjs
//   node scripts/meta/install-project-meta.mjs --only=bbeats,skyfall
//   node scripts/meta/install-project-meta.mjs --force-config   # rewrite configs
//   node scripts/meta/install-project-meta.mjs --dry-run

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { repoRegistry, portfolioRoot } from './repo-registry.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const templateDir = path.join(scriptDir, 'template');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const forceConfig = args.includes('--force-config');
const onlyArg = args.find((arg) => arg.startsWith('--only='));
const only = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',').map((value) => value.trim())) : null;

const projectData = readJson(path.join(portfolioRoot, 'src', 'project-data.json')) ?? [];
const repoAnalysis = readJson(path.join(portfolioRoot, 'src', 'repo-analysis.json')) ?? [];
const captureModule = await import(
  pathToFileURL(path.join(portfolioRoot, 'scripts', 'project-capture.config.mjs')).href
).catch(() => ({}));
const captureTargets = captureModule.projectCaptureTargets ?? {};

const projectBySlug = new Map(projectData.map((entry) => [entry.slug, entry]));
const analysisBySlug = new Map(repoAnalysis.map((entry) => [entry.slug, entry]));

const generatorSource = fs.readFileSync(path.join(templateDir, 'generate-project-meta.mjs'), 'utf8');
const schemaSource = fs.readFileSync(path.join(templateDir, 'project.meta.schema.json'), 'utf8');

const summary = [];

for (const entry of repoRegistry) {
  if (only && !only.has(entry.slug)) continue;
  if (!fs.existsSync(entry.dir)) {
    summary.push({ slug: entry.slug, status: 'missing repo', detail: entry.dir });
    continue;
  }

  const scriptsDir = path.join(entry.dir, 'scripts');
  const configPath = path.join(scriptsDir, 'project-meta.config.mjs');
  const configExists = fs.existsSync(configPath);
  const actions = [];

  if (!dryRun) fs.mkdirSync(scriptsDir, { recursive: true });

  if (!configExists || forceConfig) {
    const contents = buildConfigFile(entry);
    if (!dryRun) fs.writeFileSync(configPath, contents);
    actions.push(configExists ? 'config rewritten' : 'config created');
  } else {
    actions.push('config kept');
  }

  actions.push(writeIfChanged(path.join(scriptsDir, 'generate-project-meta.mjs'), generatorSource, 'generator'));
  actions.push(writeIfChanged(path.join(scriptsDir, 'project.meta.schema.json'), schemaSource, 'schema'));

  const packageAction = ensurePackageScripts(entry.dir);
  if (packageAction) actions.push(packageAction);

  summary.push({ slug: entry.slug, status: actions.filter(Boolean).join(', '), detail: path.basename(entry.dir) });
}

const width = Math.max(...summary.map((row) => row.slug.length));
for (const row of summary) {
  console.log(row.slug.padEnd(width) + '  ' + row.status + '  (' + row.detail + ')');
}
console.log('\n' + summary.length + ' repos processed' + (dryRun ? ' (dry run, nothing written)' : '') + '.');

// ------------------------------------------------------------------ builders

function buildConfigFile(entry) {
  const project = projectBySlug.get(entry.slug);
  const analysis = analysisBySlug.get(entry.slug);
  const capture = captureTargets[entry.slug];

  // Registry text is a fallback: where the portfolio already curated a field, its
  // wording wins so installing the toolkit never rewrites existing copy.
  const curated = Object.assign({}, entry.curated ?? {}, pruneEmpty({
    title: project?.title,
    subtitle: project?.subtitle,
    description: project?.description,
    tags: project?.tags,
    accent: project?.accent,
    deploymentUrl: project?.deploymentUrl,
    localUrl: project?.localUrl,
    buildCommand: project?.buildCommand,
    buildOutput: project?.buildOutput,
    buildCwd: project?.buildCwd,
    serveBasePath: project?.serveBasePath,
    fallbackCommand: project?.fallbackCommand,
    fallbackCwd: project?.fallbackCwd,
    fallbackEnv: project?.fallbackEnv,
    runCommand: project?.runCommand,
    devPort: project?.localUrl ? portFromUrl(project.localUrl) : undefined,
    showcaseTier: analysis?.showcaseTier,
    showcaseOrder: analysis?.showcaseOrder,
    duplicateOf: analysis?.duplicateOf,
    excludedReason: analysis?.excludedReason
  }));

  const scores = entry.scores ?? (analysis
    ? pruneEmpty({
      priorityScore: analysis.priorityScore,
      demoabilityScore: analysis.demoabilityScore,
      depthScore: analysis.depthScore,
      polishScore: analysis.polishScore,
      uniquenessScore: analysis.uniquenessScore,
      maintenanceScore: analysis.maintenanceScore
    })
    : undefined);

  const analysisNotes = analysis?.analysisNotes ?? entry.analysisNotes ?? '';
  const shots = 'public/project-shots/' + entry.slug + '/latest';

  const lines = [];
  lines.push('// Metadata inputs for this repository - unique to ' + path.basename(entry.dir) + '.');
  lines.push('//');
  lines.push('// Everything here is curated by hand. Derived facts (stack, metrics, git,');
  lines.push('// screenshots) are computed by scripts/generate-project-meta.mjs, which writes');
  lines.push('// project.meta.json. Run it with:');
  lines.push('//   npm run meta          regenerate project.meta.json');
  lines.push('//   npm run meta:check    fail if project.meta.json is stale');
  lines.push('');
  lines.push("import path from 'node:path';");
  lines.push('');
  lines.push('// Screenshots are captured by the portfolio (npm run capture there). Point');
  lines.push('// PORTFOLIO_ROOT elsewhere, or drop images in ./project-media, to override.');
  lines.push('const portfolioRoot = process.env.PORTFOLIO_ROOT ?? String.raw`' + portfolioRoot + '`;');
  lines.push('');
  lines.push('export default {');
  lines.push('  slug: ' + quote(entry.slug) + ',');
  lines.push('  classification: ' + quote(entry.classification ?? 'web-app') + ',');
  if (entry.appDir) {
    lines.push('  // The runnable web app lives in this subdirectory.');
    lines.push('  appDir: ' + quote(entry.appDir) + ',');
  }
  lines.push('');
  lines.push('  curated: ' + indentBlock(JSON.stringify(curated, null, 2), '  ') + ',');
  lines.push('');
  if (capture) {
    lines.push('  // How the portfolio screenshot pipeline photographs this project.');
    lines.push('  capture: ' + indentBlock(JSON.stringify(capture, null, 2), '  ') + ',');
    lines.push('');
  }
  if (scores && Object.keys(scores).length > 0) {
    lines.push('  scores: ' + indentBlock(JSON.stringify(scores, null, 2), '  ') + ',');
    lines.push('');
  }
  if (analysisNotes) {
    lines.push('  analysisNotes:');
    lines.push('    ' + quote(analysisNotes) + ',');
    lines.push('');
  }
  lines.push('  media: {');
  lines.push("    sourceDir: path.join(portfolioRoot, " + shots.split('/').map(quote).join(', ') + '),');
  lines.push('    publicPathPrefix: ' + quote('/project-shots/' + entry.slug + '/latest') + ',');
  lines.push('    primaryProfile: "card"');
  lines.push('  }');
  lines.push('};');
  lines.push('');
  return lines.join('\n');
}

function ensurePackageScripts(repoDir) {
  const packagePath = path.join(repoDir, 'package.json');
  const packageJson = readJson(packagePath);
  if (!packageJson) return 'no package.json';

  const scripts = packageJson.scripts ?? {};
  const wanted = {
    meta: 'node scripts/generate-project-meta.mjs',
    'meta:check': 'node scripts/generate-project-meta.mjs --check'
  };
  const missing = Object.entries(wanted).filter(([key, value]) => scripts[key] !== value);
  if (missing.length === 0) return '';

  for (const [key, value] of missing) scripts[key] = value;
  packageJson.scripts = scripts;
  if (!dryRun) fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  return 'package scripts added';
}

function writeIfChanged(targetPath, contents, label) {
  const existing = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf8') : null;
  if (existing === contents) return '';
  if (!dryRun) fs.writeFileSync(targetPath, contents);
  return existing === null ? label + ' installed' : label + ' updated';
}

// ------------------------------------------------------------------- helpers

function portFromUrl(url) {
  const match = /:(\d{2,5})/.exec(String(url));
  return match ? Number(match[1]) : undefined;
}

// Double-quoted JSON strings are valid JavaScript string literals and need no
// escaping rules of their own, so the generated config stays safe for any text.
function quote(value) {
  return JSON.stringify(String(value));
}

function indentBlock(block, indent) {
  return block.split('\n').map((line, index) => (index === 0 ? line : indent + line)).join('\n');
}

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

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}
