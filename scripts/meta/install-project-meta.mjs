#!/usr/bin/env node
// Installs the project metadata toolkit into every repo listed in
// scripts/meta/repo-registry.mjs.
//
// Each repo receives:
//   scripts/project-meta.config.mjs   unique to that repo (written once)
//   scripts/generate-project-meta.mjs the shared generator (kept in sync)
//   scripts/capture-project-shots.mjs the screenshot run
//   scripts/generate-social-preview.mjs the link-preview card
//   scripts/generate-app-icons.mjs    the icon set + web manifest
//   scripts/refresh-project-meta.mjs  shots -> social -> icons -> meta in one go
//   scripts/project.meta.schema.json  the schema (kept in sync)
//   package.json scripts: meta, meta:check, shots, social, social:check,
//                         icons, icons:check, meta:refresh
//   .githooks/pre-push                the push gate (card + icons must be current),
//                                     wired with git config core.hooksPath .githooks
//   .github/workflows/project-meta.yml the same check in CI (deployed repos only)
//
// Repos that format their scripts (a prettier binary in node_modules) get the
// installed copies run through it, so a reinstall never fights the formatter.
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
import { spawnSync } from 'node:child_process';
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
const captureSource = fs.readFileSync(path.join(templateDir, 'capture-project-shots.mjs'), 'utf8');
const socialSource = fs.readFileSync(path.join(templateDir, 'generate-social-preview.mjs'), 'utf8');
const iconsSource = fs.readFileSync(path.join(templateDir, 'generate-app-icons.mjs'), 'utf8');
const refreshSource = fs.readFileSync(path.join(templateDir, 'refresh-project-meta.mjs'), 'utf8');
const hookSource = fs.readFileSync(path.join(templateDir, 'pre-push'), 'utf8');
const workflowSource = fs.readFileSync(path.join(templateDir, 'project-meta.yml'), 'utf8');
const unmanagedClassifications = new Set(['duplicate', 'archived', 'template', 'hosted-only']);

const installedFiles = {
  'generate-project-meta.mjs': { contents: generatorSource, label: 'generator' },
  'project.meta.schema.json': { contents: schemaSource, label: 'schema' },
  'capture-project-shots.mjs': { contents: captureSource, label: 'capture script' },
  'generate-social-preview.mjs': { contents: socialSource, label: 'social script' },
  'generate-app-icons.mjs': { contents: iconsSource, label: 'icon script' },
  'refresh-project-meta.mjs': { contents: refreshSource, label: 'refresh script' }
};

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

  const formatter = findFormatter(entry.dir);
  for (const [fileName, file] of Object.entries(installedFiles)) {
    actions.push(writeIfChanged(path.join(scriptsDir, fileName), file.contents, file.label, formatter));
  }

  const packageAction = ensurePackageScripts(entry.dir);
  if (packageAction) actions.push(packageAction);

  // Only a deployed project has a card to gate; the repo's own config says so.
  const deployed = await isDeployed(configPath, entry);
  if (!unmanagedClassifications.has(entry.classification) && deployed) {
    actions.push(installPushGate(entry.dir));
  }

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
  const social = entry.social ?? detectSocial(entry.dir);
  if (social) {
    lines.push('  // Where the link-preview card lives: the page head that carries the Open');
    lines.push('  // Graph tags, and the static directory the image is published from.');
    lines.push('  social: ' + indentBlock(JSON.stringify(social, null, 2), '  ') + ',');
    lines.push('');
  }
  if (entry.icons) {
    lines.push('  // How scripts/generate-app-icons.mjs treats this project: generate the set');
    lines.push('  // from favicon.svg, or only check the links of a set the project renders itself.');
    lines.push('  icons: ' + indentBlock(JSON.stringify(entry.icons, null, 2), '  ') + ',');
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

// Every project keeps its page head and its static files somewhere different, so
// find them rather than assume. A registry entry can override with `social`.
function detectSocial(repoDir) {
  const candidates = ['index.html', 'app/index.html', 'src/index.html', 'public/index.html', 'apps/example-web/index.html'];
  const htmlFile = candidates.find((relative) => fs.existsSync(path.join(repoDir, relative)));
  if (!htmlFile) return null;

  const directory = path.dirname(htmlFile);
  const isAngularSource = htmlFile === 'src/index.html' && fs.existsSync(path.join(repoDir, 'angular.json'));
  if (isAngularSource) {
    return { htmlFile, staticDir: 'src/assets', imageName: 'og-image.jpg', imageUrlPath: '/assets/og-image.jpg' };
  }

  // A bundler serves the page's sibling `public/` directory, so the image goes
  // there even when the directory does not exist yet - next to index.html it
  // would never reach the build output.
  const nestedPublic = path.join(directory === '.' ? '' : directory, 'public');
  const staticDir = htmlFile.endsWith('public/index.html') ? directory : nestedPublic;

  return {
    htmlFile,
    staticDir: staticDir.split(path.sep).join('/'),
    imageName: 'og-image.jpg',
    imageUrlPath: '/og-image.jpg'
  };
}

function ensurePackageScripts(repoDir) {
  const packagePath = path.join(repoDir, 'package.json');
  if (!fs.existsSync(packagePath)) return 'no package.json';
  const original = fs.readFileSync(packagePath, 'utf8');
  const packageJson = readJson(packagePath);
  if (!packageJson) return 'no package.json';

  const scripts = packageJson.scripts ?? {};
  const wanted = {
    meta: 'node scripts/generate-project-meta.mjs',
    'meta:check': 'node scripts/generate-project-meta.mjs --check',
    shots: 'node scripts/capture-project-shots.mjs',
    social: 'node scripts/generate-social-preview.mjs',
    'social:check': 'node scripts/generate-social-preview.mjs --check',
    icons: 'node scripts/generate-app-icons.mjs',
    'icons:check': 'node scripts/generate-app-icons.mjs --check',
    'meta:refresh': 'node scripts/refresh-project-meta.mjs'
  };
  const missing = Object.entries(wanted).filter(([key, value]) => scripts[key] !== value);
  if (missing.length === 0) return '';

  for (const [key, value] of missing) scripts[key] = value;
  packageJson.scripts = scripts;
  // Rewrite in the file's own style, so adding two scripts never shows up as a
  // whole-file reformat in someone's diff.
  if (!dryRun) fs.writeFileSync(packagePath, renderPackageJson(packageJson, original));
  return 'package scripts added';
}

// The gate lives in a committed .githooks/ directory (git's own hooks dir is
// not versioned) and is switched on per clone with core.hooksPath. The same
// check runs in CI so a --no-verify push or another machine still gets a red X.
function installPushGate(repoDir) {
  const actions = [];
  const hookPath = path.join(repoDir, '.githooks', 'pre-push');
  if (!dryRun) fs.mkdirSync(path.dirname(hookPath), { recursive: true });
  const hookAction = writeIfChanged(hookPath, hookSource.replace(/\r\n/g, '\n'), 'pre-push hook');
  if (hookAction) actions.push(hookAction);
  if (!dryRun) {
    // Stage the hook with its executable bit so the commit carries it; Windows
    // has no mode bit to read from the file itself.
    spawnSync('git', ['update-index', '--add', '--chmod=+x', '.githooks/pre-push'], { cwd: repoDir, stdio: 'ignore' });
    const current = spawnSync('git', ['config', '--get', 'core.hooksPath'], { cwd: repoDir, encoding: 'utf8' });
    if (current.status !== 0 || current.stdout.trim() === '') {
      spawnSync('git', ['config', 'core.hooksPath', '.githooks'], { cwd: repoDir, stdio: 'ignore' });
      actions.push('hooksPath set');
    } else if (current.stdout.trim() !== '.githooks') {
      actions.push('hooksPath already ' + current.stdout.trim() + ' (hook not wired)');
    }
  }
  const workflowPath = path.join(repoDir, '.github', 'workflows', 'project-meta.yml');
  if (!dryRun) fs.mkdirSync(path.dirname(workflowPath), { recursive: true });
  const workflowAction = writeIfChanged(workflowPath, workflowSource, 'CI workflow');
  if (workflowAction) actions.push(workflowAction);
  return actions.join(', ');
}

async function isDeployed(configPath, entry) {
  if (entry.curated && entry.curated.deploymentUrl) return true;
  if (!fs.existsSync(configPath)) return false;
  try {
    const module_ = await import(pathToFileURL(configPath).href + '?t=' + Date.now());
    return Boolean(module_.default && module_.default.curated && module_.default.curated.deploymentUrl);
  } catch {
    return false;
  }
}

function renderPackageJson(packageJson, original) {
  const indentMatch = /\n([ \t]+)"/.exec(original);
  const indent = indentMatch ? indentMatch[1] : '  ';
  const trailingNewline = /\n$/.test(original) ? '\n' : '';
  const rendered = JSON.stringify(packageJson, null, indent) + trailingNewline;
  return original.includes('\r\n') ? rendered.replace(/\n/g, '\r\n') : rendered;
}

// A repo that formats its scripts holds a prettier-shaped copy of the template.
// Format the template the same way before comparing, so "unchanged" means the
// same code, not the same whitespace.
function writeIfChanged(targetPath, contents, label, formatter) {
  const existing = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf8') : null;
  const next = formatter ? formatter(targetPath, contents) : contents;
  if (existing === next) return '';
  if (!dryRun) fs.writeFileSync(targetPath, next);
  return existing === null ? label + ' installed' : label + ' updated';
}

function findFormatter(repoDir) {
  const binary = path.join(repoDir, 'node_modules', 'prettier', 'bin', 'prettier.cjs');
  if (!fs.existsSync(binary)) return null;
  return (targetPath, contents) => {
    const run = spawnSync(process.execPath, [binary, '--stdin-filepath', targetPath], {
      cwd: repoDir,
      input: contents,
      encoding: 'utf8'
    });
    if (run.status !== 0) return contents;
    return run.stdout;
  };
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
