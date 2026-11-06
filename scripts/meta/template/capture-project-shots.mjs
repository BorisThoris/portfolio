#!/usr/bin/env node
// Photographs this project into ./project-media, using the capture recipe in
// ./project-meta.config.mjs - this project's own route, ready selector, warm-up
// clicks and elements to hide - and refuses a picture that is not the app:
// a recipe step that cannot be reached, or a frame that is blank, black or a
// loading screen, fails the profile instead of shipping it.
//
// Profiles: card (1600x900), desktop (1440x900), mobile (430x932), full (full
// page) and og (1200x630, the image a chat or social card shows when someone
// pastes the deployment link).
//
// Usage:
//   npm run shots                      # capture from the deployment when there is one
//   npm run shots -- --source=local     # start the dev server and capture that
//   npm run shots -- --profiles=og,card
//   npm run shots -- --check            # inspect the dependency fingerprint without opening a browser
//   npm run shots -- --force            # recapture even when inputs are unchanged
//   npm run shots -- --url=https://...  # capture an explicit URL
//   npm run shots -- --lenient          # keep going past a failed recipe step (for debugging a recipe)
//
// Every profile's frame statistics and any skipped steps are written to
// project-media/capture.json; scripts/project-media.test.mjs reads them back
// and fails when a picture did not pass. Playwright is resolved from this repo
// if it has one, otherwise from the portfolio checkout (PORTFOLIO_ROOT).
//
// Installed by the portfolio meta toolkit; edit the template there.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import config from './project-meta.config.mjs';
import { PROFILES, assessFrame, frameStats, joinUrl, loadChromium, resolveBaseUrl, settle } from './project-media-lib.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const outputDir = path.join(repoRoot, valueOf('--out') ?? 'project-media');
const lenient = process.argv.includes('--lenient');

const requested = (valueOf('--profiles') ?? Object.keys(PROFILES).join(',')).split(',').map((name) => name.trim());
const unknown = requested.filter((name) => !PROFILES[name]);
if (unknown.length > 0) {
  console.error('[shots] unknown profile(s): ' + unknown.join(', ') + '. Known: ' + Object.keys(PROFILES).join(', '));
  process.exit(2);
}

const capture = config.capture ?? {};
// A project whose pictures are rendered rather than photographed (a poster set
// from its own scene, see build-project-trailers.mjs) opts out here.
if (capture.skip) {
  console.log('[shots] ' + config.slug + ': screenshots are not taken for this project' +
    (typeof capture.skip === 'string' ? ' - ' + capture.skip : '') + '.');
  process.exit(0);
}
const route = capture.route ?? '/';
const source = valueOf('--url') !== undefined ? 'explicit' : valueOf('--source') ?? (config.curated?.deploymentUrl ? 'deployment' : 'local');
const sourceUrl = source === 'explicit' ? valueOf('--url') : source === 'deployment' ? config.curated?.deploymentUrl :
  config.curated?.localUrl ?? 'http://127.0.0.1:' + (config.curated?.devPort ?? 5173) + '/';
const target = sourceUrl ? joinUrl(sourceUrl, route) : null;
// A deployed screenshot depends on what the deployed page actually serves.
// Local source edits alone do not mean the deployment changed, and a remote
// release can change while this checkout stays untouched.
const fingerprint = source === 'deployment' || source === 'explicit'
  ? await deployedFingerprint(target, capture.remoteAssets ?? [])
  : inputFingerprint(capture.inputs ?? defaultCaptureInputs());
const previous = readManifest(path.join(outputDir, 'capture.json'));
const legacyCurrent = fingerprint && !lenient && !process.argv.includes('--force') && !previous?.dependencySchema &&
  previous?.inputFingerprint === fingerprint && previous.source === source && previous.url === target &&
  JSON.stringify(previous.recipe) === JSON.stringify(capture);
const dependencyHash = (name) => crypto.createHash('sha256').update(JSON.stringify({
  version: 1, fingerprint, source, target, capture, profile: PROFILES[name]
})).digest('hex');
const currentProfile = (name) => {
  const entry = previous?.profiles?.find((profile) => profile.profile === name);
  if (!entry || entry.status !== 'captured' ||
      (!legacyCurrent && entry.dependencyHash !== dependencyHash(name))) return false;
  // --lenient keeps rejected frames and skipped steps for debugging. Such a
  // picture must not satisfy a strict run just because its inputs are unchanged.
  if (entry.lenient || entry.problems?.length > 0) return false;
  const file = path.join(outputDir, entry.file ?? name + '.jpg');
  if (!fs.existsSync(file)) return false;
  if (entry.bytes && fs.statSync(file).size !== entry.bytes) return false;
  if (entry.sha256 && crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') !== entry.sha256) return false;
  return true;
};
const pending = requested.filter((name) => lenient || process.argv.includes('--force') || !currentProfile(name));
// Every path ends by finishing normally, with process.exitCode for a failure.
// process.exit() straight after fetch aborts Node on Windows (a libuv assertion
// on a closing handle), and a crashed --check would read as stale media.
if (process.argv.includes('--fingerprint')) {
  console.log(fingerprint ?? 'unconfigured');
} else if (pending.length === 0) {
  console.log('[shots] ' + config.slug + ': capture inputs and recipe unchanged; keeping existing profiles.');
} else if (process.argv.includes('--check')) {
  console.error('[shots] ' + config.slug + ': stale profiles: ' + pending.join(', ') + '.');
  process.exitCode = 1;
} else {
  await captureProfiles();
}

async function captureProfiles() {
  let chromium;
  let base;
  try {
    chromium = await loadChromium(repoRoot, config);
    base = await resolveBaseUrl(config, repoRoot, { source: valueOf('--source'), url: valueOf('--url'), log: (line) => console.log(line.replace('[media]', '[shots]')) });
  } catch (error) {
    console.error('[shots] ' + error.message);
    process.exitCode = 2;
    return;
  }

  try {
    const target = joinUrl(base.url, route);
    console.log('[shots] ' + config.slug + ': capturing ' + target + ' (' + base.source + ')');
    fs.mkdirSync(outputDir, { recursive: true });

    const browser = await chromium.launch({ headless: true, args: capture.browserArgs ?? [] });
    const results = [];

    try {
      for (const name of pending) {
        const profile = PROFILES[name];
        const context = await browser.newContext({
          viewport: { width: profile.width, height: profile.height },
          deviceScaleFactor: 1,
          isMobile: profile.isMobile ?? false,
          hasTouch: profile.hasTouch ?? false,
          colorScheme: capture.colorScheme ?? 'dark'
        });
        const page = await context.newPage();

        try {
          await page.goto(target, { waitUntil: 'load', timeout: capture.loadTimeoutMs ?? 60000 });
          const skipped = await settle(page, capture, { strict: !lenient, log: (line) => console.log(line.replace('[media]', '[shots]')) });
          const stats = await frameStats(page);
          const problems = assessFrame(stats, capture.quality);
          if (problems.length > 0 && !lenient) throw new Error('frame rejected: ' + problems.join('; '));

          const file = path.join(outputDir, name + '.jpg');
          await page.screenshot({ path: file, type: 'jpeg', quality: profile.quality, fullPage: profile.fullPage ?? false });
          const bytes = fs.statSync(file).size;
          results.push({
            profile: name, file: path.basename(file), width: profile.width, height: profile.height, bytes,
            sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
            dependencyHash: dependencyHash(name), status: 'captured', stats, lenient: lenient || undefined,
            skipped: skipped.length > 0 ? skipped : undefined, problems: problems.length > 0 ? problems : undefined
          });
          console.log('[shots]   ' + name.padEnd(8) + ' ' + profile.width + 'x' + profile.height + '  ' + Math.round(bytes / 1024) + ' KB' +
            '  (spread ' + stats.std + ', ' + stats.colours + ' colours' + (problems.length > 0 ? '; ' + problems.join('; ') : '') + ')');
        } catch (error) {
          results.push({ profile: name, status: 'failed', error: String(error.message).split('\n')[0] });
          console.error('[shots]   ' + name.padEnd(8) + ' FAILED: ' + String(error.message).split('\n')[0]);
        } finally {
          await context.close();
        }
      }
    } finally {
      await browser.close();
    }

    const kept = (previous?.profiles ?? []).filter((profile) => !pending.includes(profile.profile)).map((profile) =>
      legacyCurrent && currentProfile(profile.profile)
        ? { ...profile, dependencyHash: dependencyHash(profile.profile) }
        : profile);
    const manifest = {
      slug: config.slug,
      dependencySchema: 1,
      capturedAt: new Date().toISOString(),
      source: base.source,
      url: target,
      recipe: capture,
      ...(fingerprint ? { inputFingerprint: fingerprint } : {}),
      profiles: [...kept, ...results]
    };
    fs.writeFileSync(path.join(outputDir, 'capture.json'), JSON.stringify(manifest, null, 2) + '\n');

    const failed = results.filter((entry) => entry.status !== 'captured');
    console.log('[shots] ' + config.slug + ': ' + (results.length - failed.length) + '/' + results.length +
      ' profiles into ' + path.relative(repoRoot, outputDir) + '/');
    if (failed.length > 0) process.exitCode = 1;
  } finally {
    await base.stop();
  }
}

function valueOf(flag) {
  const argument = process.argv.find((value) => value.startsWith(flag + '='));
  return argument ? argument.slice(flag.length + 1) : undefined;
}

function readManifest(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

// A project's explicit inputs take priority. Older project configs have no
// list; fingerprint conventional application sources so a metadata, test or
// documentation commit does not recapture the same deployment indefinitely.
// The broad fallback is deliberate: an unknown app asset should cause a new
// picture rather than leave a stale one. Projects can narrow it with inputs.
function defaultCaptureInputs() {
  const candidates = [
    'src', 'app', 'apps', 'assets', 'images', 'public',
    'index.html', 'index.js', 'main.js', 'style.css',
    'package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
    'vite.config.js', 'vite.config.ts', 'vite.config.mjs', 'vite.config.mts',
    'webpack.config.js', 'angular.json',
    'scripts/capture-project-shots.mjs', 'scripts/project-media-lib.mjs'
  ];
  const inputs = candidates.filter((relative) => fs.existsSync(path.join(repoRoot, relative)));
  const appDir = config.appDir;
  if (appDir && fs.existsSync(path.join(repoRoot, appDir))) inputs.push(appDir);
  for (const entry of fs.readdirSync(repoRoot, { withFileTypes: true })) {
    if (entry.isDirectory() && /-app$/.test(entry.name)) inputs.push(entry.name);
  }
  return [
    ...new Set(inputs),
    ':(exclude)**/*.test.*', ':(exclude)**/*.spec.*',
    ':(exclude)**/node_modules/**', ':(exclude)**/dist/**',
    ':(exclude)**/build/**', ':(exclude)**/output/**',
    ':(exclude)public/project-shots/**', ':(exclude)public/trailers/**',
    ':(exclude)public/artwork/**', ':(exclude)public/og-image.jpg',
    ':(exclude)public/favicon.ico', ':(exclude)public/apple-touch-icon.png',
    ':(exclude)public/icon-192.png', ':(exclude)public/icon-512.png',
    ':(exclude)public/icon-maskable-512.png', ':(exclude)public/site.webmanifest'
  ];
}

function inputFingerprint(inputs) {
  if (!Array.isArray(inputs) || inputs.length === 0) return null;
  const paths = [];
  for (const args of [
    ['ls-files', '-z', '--', ...inputs],
    ['ls-files', '--others', '--exclude-standard', '-z', '--', ...inputs]
  ]) {
    const result = spawnSync('git', args, { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    if (result.status !== 0) throw new Error('cannot fingerprint screenshot inputs: ' + (result.stderr || '').trim());
    paths.push(...result.stdout.split('\0').filter(Boolean));
  }
  const files = [...new Set(paths)].sort();
  if (files.length === 0) throw new Error('screenshot inputs matched no files: ' + inputs.join(', '));
  // Git blob ids, with the repo's filters applied: a CRLF checkout and the Linux
  // runners must agree on the fingerprint of the same content.
  const present = files.filter((file) => {
    const full = path.join(repoRoot, file);
    return fs.existsSync(full) && fs.statSync(full).isFile();
  });
  const blobs = new Map();
  for (let start = 0; start < present.length; start += 200) {
    const chunk = present.slice(start, start + 200);
    const result = spawnSync('git', ['hash-object', '--', ...chunk], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    if (result.status !== 0) throw new Error('cannot fingerprint screenshot inputs: ' + (result.stderr || '').trim());
    const ids = result.stdout.trim().split('\n');
    chunk.forEach((file, index) => blobs.set(file, ids[index]));
  }
  const hash = crypto.createHash('sha256');
  for (const file of files) {
    const full = path.join(repoRoot, file);
    hash.update('\0' + file + '\0');
    if (!fs.existsSync(full)) { hash.update('deleted'); continue; }
    if (blobs.has(file)) hash.update(blobs.get(file));
  }
  return hash.digest('hex');
}

async function deployedFingerprint(url, extraAssets) {
  if (!url) throw new Error('cannot fingerprint a deployment without a URL');
  const pageUrl = new URL(url);
  const page = await fetchDependency(pageUrl);
  // Relative references resolve against the page after any redirect.
  const finalUrl = new URL(page.url);
  const html = page.bytes.toString('utf8');
  const references = htmlAttributes(html, 'script|link|img', 'src|href');
  // The browser resolves the page's own references against <base href>, when it has one.
  const documentBase = documentBaseUrl(html, finalUrl);
  const assets = [...new Set([
    ...references.map((reference) => new URL(reference, documentBase)),
    ...extraAssets.map((reference) => new URL(reference, finalUrl))
  ]
    .filter((asset) => asset.origin === finalUrl.origin && /^https?:$/.test(asset.protocol))
    .map((asset) => asset.href))].sort();
  const hash = crypto.createHash('sha256');
  hash.update(finalUrl.href);
  hash.update(page.bytes);
  for (const asset of assets) {
    hash.update('\0' + asset + '\0');
    // A page can work with a broken image, so a missing asset changes the
    // fingerprint instead of stopping the capture. The page itself must load.
    hash.update((await fetchDependency(asset, { allowMissing: true })).bytes);
  }
  return hash.digest('hex');
}

// Attribute values quoted either way or not at all: minifiers strip the quotes.
// A function, not a module constant: it runs before the module body reaches the end.
function htmlAttributes(html, tags, attributes) {
  const pattern = new RegExp('<(?:' + tags + ')\\b[^>]*?\\s(?:' + attributes + ')\\s*=\\s*' +
    '(?:"([^"]*)"|\'([^\']*)\'|([^\\s"\'>]+))', 'gi');
  return [...html.matchAll(pattern)].map((match) => match[1] ?? match[2] ?? match[3]).filter(Boolean);
}

function documentBaseUrl(html, pageUrl) {
  const href = htmlAttributes(html, 'base', 'href')[0];
  if (!href) return pageUrl;
  try { return new URL(href, pageUrl); } catch { return pageUrl; }
}

async function fetchDependency(url, { allowMissing = false } = {}) {
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok && allowMissing) return { url: response.url || String(url), bytes: Buffer.from('HTTP ' + response.status) };
  if (!response.ok) throw new Error('cannot fingerprint ' + url + ': HTTP ' + response.status);
  const length = Number(response.headers.get('content-length') || 0);
  if (length > 16 * 1024 * 1024) throw new Error('capture dependency too large: ' + url);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > 16 * 1024 * 1024) throw new Error('capture dependency too large: ' + url);
  return { url: response.url || String(url), bytes };
}
