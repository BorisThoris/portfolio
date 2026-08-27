import { chromium } from '@playwright/test';
import { execFile } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import {
  buildProject,
  findBuildOutput,
  hasUsableBuild,
  probeUrl,
  readProjects,
  startCommandServer,
  startRunCommandServer,
  startStaticServer,
  waitForUrl
} from './project-runtime.mjs';
import {
  captureOptionsFor,
  captureProfiles,
  validateCaptureTargets
} from './project-capture.config.mjs';

const execFileAsync = promisify(execFile);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const portfolioRoot = path.resolve(scriptDir, '..');
const outputRoot = path.join(portfolioRoot, 'public', 'project-shots');
const manifestPath = path.join(outputRoot, 'capture-manifest.json');
const manifestSchemaVersion = 2;
const arguments_ = parseArguments(process.argv.slice(2));
const projects = readProjects();

if (arguments_.help) {
  printHelp();
  process.exit(0);
}

validateCaptureTargets(projects);
const targets = selectProjects(projects, arguments_.projects);

if (arguments_.list) {
  printCaptureTargets(targets);
  process.exit(0);
}

if (arguments_.check) {
  const failures = await checkCaptures(targets, arguments_);
  process.exit(failures.length > 0 ? 1 : 0);
}

await fs.mkdir(outputRoot, { recursive: true });
const manifest = await loadManifest();
manifest.schemaVersion = manifestSchemaVersion;
const browser = await chromium.launch({ headless: true });
const failures = [];

try {
  for (const project of targets) {
    const projectEntry = manifest.projects[project.slug] || {
      title: project.title,
      states: {}
    };
    projectEntry.title = project.title;
    manifest.projects[project.slug] = projectEntry;

    for (const state of arguments_.states) {
      console.log(`\n[${state}] ${project.slug}`);
      let prepared;

      try {
        prepared = await prepareCaptureSource(project, state, arguments_);
        const result = await captureState(browser, project, state, prepared, arguments_.profiles);
        const previousState = projectEntry.states[state] || {};
        projectEntry.states[state] = {
          ...previousState,
          ...result,
          images: {
            ...(previousState.images || {}),
            ...result.images
          }
        };
        for (const warning of result.warnings || []) {
          console.warn(`[warn] ${project.slug}/${state}/${warning}`);
        }

        if (result.status !== 'captured') {
          failures.push(`${project.slug}/${state}: ${result.error || 'one or more profiles failed'}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        projectEntry.states[state] = {
          ...(projectEntry.states[state] || {}),
          status: 'failed',
          capturedAt: new Date().toISOString(),
          error: message
        };
        failures.push(`${project.slug}/${state}: ${message}`);
        console.error(`[fail] ${project.slug}/${state}: ${message}`);
      } finally {
        if (prepared?.close) {
          try {
            prepared.close();
          } catch {
            // The capture is already complete; server cleanup is best effort.
          }
        }
      }

      manifest.generatedAt = new Date().toISOString();
      await writeManifest(manifest);
    }
  }
} finally {
  await browser.close();
}

printSummary(targets, arguments_, failures);
process.exit(failures.length > 0 && !arguments_.allowPartial ? 1 : 0);

async function captureState(browserInstance, project, state, source, profileNames) {
  const stateDirectory = path.join(outputRoot, project.slug, state);
  await fs.mkdir(stateDirectory, { recursive: true });
  const options = captureOptionsFor(project, state);
  const captureUrl = resolveCaptureUrl(source.url, options.route);
  const images = {};
  const profileFailures = [];
  const profileWarnings = [];

  for (const profileName of profileNames) {
    const profile = captureProfiles[profileName];
    const outputPath = path.join(stateDirectory, `${profileName}.jpg`);
    const consoleErrors = new Set();
    const context = await browserInstance.newContext({
      viewport: { width: profile.width, height: profile.height },
      deviceScaleFactor: 1,
      colorScheme: options.colorScheme,
      isMobile: profile.isMobile || false,
      hasTouch: profile.hasTouch || false,
      reducedMotion: 'no-preference'
    });

    await context.addInitScript(() => {
      try {
        window.localStorage.clear();
        window.sessionStorage.clear();
      } catch {
        // Storage may be unavailable on the initial empty document.
      }
    });

    const page = await context.newPage();
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.add(message.text());
    });
    page.on('pageerror', (error) => consoleErrors.add(error.message));

    try {
      const response = await page.goto(captureUrl, {
        waitUntil: 'domcontentloaded',
        timeout: options.navigationTimeoutMs
      });

      if (response && response.status() >= 400) {
        throw new Error(`${captureUrl} returned HTTP ${response.status()}`);
      }

      await page.locator(options.readySelector).first().waitFor({
        state: options.readyState,
        timeout: options.readyTimeoutMs
      });
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(options.waitAfterReadyMs);
      await page.addStyleTag({
        content: `
          html { scroll-behavior: auto !important; }
          *, *::before, *::after {
            caret-color: transparent !important;
            transition-duration: 0s !important;
            animation-play-state: paused !important;
          }
        `
      });

      if (options.hideSelectors?.length) {
        for (const selector of options.hideSelectors) {
          await page.locator(selector).evaluateAll((nodes) => {
            for (const node of nodes) node.style.visibility = 'hidden';
          });
        }
      }

      const pageHealth = await page.evaluate(() => {
        const bodyTextLength = document.body?.innerText.trim().length || 0;
        const visibleSurfaceCount = [...document.querySelectorAll(
          'main, section, article, img, canvas, svg, button, input, video, iframe, [role="img"]'
        )].filter((node) => {
          const style = window.getComputedStyle(node);
          const rect = node.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width * rect.height >= 100;
        }).length;
        return {
          status: bodyTextLength > 0 || visibleSurfaceCount > 0 ? 'rendered' : 'blank',
          bodyTextLength,
          visibleSurfaceCount
        };
      });

      const screenshotOptions = {
        type: 'jpeg',
        quality: profile.quality,
        animations: 'disabled'
      };
      if (profile.fullPage) {
        const documentHeight = await page.evaluate(() => Math.max(
          window.innerHeight,
          document.documentElement.scrollHeight,
          document.body?.scrollHeight || 0
        ));
        screenshotOptions.clip = {
          x: 0,
          y: 0,
          width: profile.width,
          height: documentHeight
        };
      }
      const buffer = await page.screenshot(screenshotOptions);
      const dimensions = readJpegSize(buffer);
      validateDimensions(profileName, profile, dimensions);
      await fs.writeFile(outputPath, buffer);
      if (pageHealth.status === 'blank') {
        profileWarnings.push(`${profileName}: the page rendered blank`);
      }

      images[profileName] = {
        label: profile.label,
        path: toPosix(path.relative(portfolioRoot, outputPath)),
        width: dimensions.width,
        height: dimensions.height,
        bytes: buffer.length,
        sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
        pageHealth,
        consoleErrors: [...consoleErrors].slice(0, 10)
      };
      console.log(`[captured] ${project.slug}/${state}/${profileName} ${dimensions.width}x${dimensions.height}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      profileFailures.push(`${profileName}: ${message}`);
      console.error(`[fail] ${project.slug}/${state}/${profileName}: ${message}`);
    } finally {
      await context.close();
    }
  }

  return {
    status: profileFailures.length === 0 ? 'captured' : 'partial',
    capturedAt: new Date().toISOString(),
    sourceUrl: source.url,
    captureRoute: options.route,
    captureUrl,
    sourceKind: source.kind,
    buildMode: source.buildMode,
    fallbackReason: source.fallbackReason,
    git: source.git,
    images,
    warnings: profileWarnings,
    error: profileFailures.length > 0 ? profileFailures.join('; ') : undefined
  };
}

async function prepareCaptureSource(project, state, options) {
  if (state === 'stable') {
    const url = project.deploymentUrl || project.localUrl;
    if (!url) throw new Error('No deploymentUrl or localUrl is configured');
    return {
      url,
      kind: project.deploymentUrl ? 'deployment' : 'configured-url',
      buildMode: 'none'
    };
  }

  const localRepository = await isLocalDirectory(project.repoPath);
  if (!localRepository) {
    const url = project.deploymentUrl || project.localUrl;
    if (!url) throw new Error('No local repository or deployment URL is configured');
    return {
      url,
      kind: 'managed-deployment',
      buildMode: 'none',
      fallbackReason: 'The project is managed remotely rather than from a local repository.'
    };
  }

  if (options.reuseLive) {
    const liveProbe = await probeUrl(project.localUrl, 1800);
    if (liveProbe.ok) {
      return {
        url: project.localUrl,
        kind: 'local-server',
        buildMode: 'live-explicitly-reused',
        git: await readGitMetadata(project.repoPath)
      };
    }
  }

  if (options.buildLatest) {
    console.log(`[build] ${project.slug}: ${project.buildCommand}`);
    const build = await buildProject(project);
    if (!build.ok) {
      const buildError = `${project.buildCommand} exited ${build.code ?? 'without a usable output'}`;
      console.warn(`[fallback] ${project.slug}: ${buildError}; trying the current-source dev server`);
      await requireConfiguredServerToBeOffline(project);
      const developmentServer = startRunCommandServer(project);
      const developmentReady = await waitForUrl(project.localUrl, 60000, 15000);
      if (developmentReady.ok) {
        return {
          url: project.localUrl,
          kind: 'local-dev',
          buildMode: 'dev-after-build-failure',
          fallbackReason: buildError,
          git: await readGitMetadata(project.repoPath),
          close: developmentServer.close
        };
      }
      developmentServer.close();
      throw new Error(`${buildError}; dev fallback did not become ready (${developmentReady.status})`);
    }
  } else if (!hasUsableBuild(project)) {
    throw new Error('No usable existing build; remove --no-build or build the project first');
  }

  const outputDirectory = findBuildOutput(project);
  if (!outputDirectory && !project.fallbackCommand) {
    throw new Error(`No build output found at ${project.buildOutput}`);
  }

  const hasStaticIndex = outputDirectory && await exists(path.join(outputDirectory, 'index.html'));
  let server;
  if (hasStaticIndex) {
    server = startStaticServer(project, outputDirectory, { port: 0 });
  } else {
    await requireConfiguredServerToBeOffline(project);
    server = startCommandServer(project);
  }
  let sourceUrl = project.localUrl;
  if (hasStaticIndex) {
    const serverReady = await server.ready;
    if (!serverReady.ok) {
      throw new Error(`Isolated static capture server failed: ${serverReady.error.message}`);
    }
    sourceUrl = server.url;
  }
  const ready = await waitForUrl(sourceUrl, 20000);
  if (!ready.ok) {
    server.close();
    throw new Error(`Local capture server did not become ready (${ready.status})`);
  }

  return {
    url: sourceUrl,
    kind: 'local-build',
    buildMode: options.buildLatest ? 'rebuilt' : 'existing',
    git: await readGitMetadata(project.repoPath),
    close: server.close
  };
}

async function requireConfiguredServerToBeOffline(project) {
  const probe = await probeUrl(project.localUrl, 1800);
  if (probe.status !== 'offline') {
    throw new Error(
      `${project.localUrl} is already responding or occupied; stop that process, or use --reuse-live to explicitly trust it`
    );
  }
}

async function readGitMetadata(repositoryPath) {
  try {
    const [{ stdout: head }, { stdout: branch }, { stdout: status }] = await Promise.all([
      execFileAsync('git', ['-C', repositoryPath, 'rev-parse', 'HEAD'], { windowsHide: true }),
      execFileAsync('git', ['-C', repositoryPath, 'rev-parse', '--abbrev-ref', 'HEAD'], { windowsHide: true }),
      execFileAsync('git', ['-C', repositoryPath, 'status', '--porcelain'], { windowsHide: true })
    ]);
    return {
      head: head.trim(),
      branch: branch.trim(),
      dirty: Boolean(status.trim())
    };
  } catch {
    return undefined;
  }
}

async function checkCaptures(selectedProjects, options) {
  const manifest = await loadManifest();
  const failures = [];

  if (manifest.schemaVersion !== manifestSchemaVersion) {
    failures.push(`manifest schema is ${manifest.schemaVersion || 'missing'}; expected ${manifestSchemaVersion}`);
  }

  for (const project of selectedProjects) {
    for (const state of options.states) {
      const stateEntry = manifest.projects[project.slug]?.states?.[state];
      if (!stateEntry || stateEntry.status !== 'captured') {
        failures.push(`${project.slug}/${state}: manifest status is ${stateEntry?.status || 'missing'}`);
        continue;
      }

      const captureOptions = captureOptionsFor(project, state);
      if (stateEntry.captureRoute !== captureOptions.route) {
        failures.push(
          `${project.slug}/${state}: manifest route is ${stateEntry.captureRoute || 'missing'}; expected ${captureOptions.route}`
        );
      }
      if (!stateEntry.captureUrl || !captureUrlUsesRoute(stateEntry.captureUrl, captureOptions.route)) {
        failures.push(`${project.slug}/${state}: capture URL does not match ${captureOptions.route}`);
      }

      for (const profileName of options.profiles) {
        const profile = captureProfiles[profileName];
        const imageEntry = stateEntry.images?.[profileName];
        const filePath = path.join(outputRoot, project.slug, state, `${profileName}.jpg`);
        if (!imageEntry || !(await exists(filePath))) {
          failures.push(`${project.slug}/${state}/${profileName}: file or manifest entry is missing`);
          continue;
        }

        try {
          const buffer = await fs.readFile(filePath);
          const dimensions = readJpegSize(buffer);
          validateDimensions(profileName, profile, dimensions);
          const hash = crypto.createHash('sha256').update(buffer).digest('hex');
          if (hash !== imageEntry.sha256) {
            failures.push(`${project.slug}/${state}/${profileName}: SHA-256 differs from the manifest`);
          }
        } catch (error) {
          failures.push(`${project.slug}/${state}/${profileName}: ${error.message}`);
        }
      }
    }
  }

  if (failures.length === 0) {
    console.log(`PASS ${selectedProjects.length} project(s), ${options.states.length} state(s), ${options.profiles.length} profile(s)`);
  } else {
    console.error(`FAIL ${failures.length} capture check(s)`);
    for (const failure of failures) console.error(`- ${failure}`);
  }

  return failures;
}

function validateDimensions(profileName, profile, dimensions) {
  const widthMatches = dimensions.width === profile.width;
  const heightMatches = profile.fullPage
    ? dimensions.height >= profile.height
    : dimensions.height === profile.height;

  if (!widthMatches || !heightMatches) {
    const expectedHeight = profile.fullPage ? `at least ${profile.height}` : profile.height;
    throw new Error(
      `${profileName} expected ${profile.width}x${expectedHeight}, found ${dimensions.width}x${dimensions.height}`
    );
  }
}

function readJpegSize(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    throw new Error('Capture is not a valid JPEG');
  }

  const startOfFrameMarkers = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf
  ]);
  let offset = 2;

  while (offset + 8 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    while (buffer[offset] === 0xff) offset += 1;
    const marker = buffer[offset];
    offset += 1;
    if (marker === 0xd8 || marker === 0xd9) continue;
    if (offset + 1 >= buffer.length) break;
    const segmentLength = buffer.readUInt16BE(offset);
    if (startOfFrameMarkers.has(marker)) {
      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5)
      };
    }
    if (segmentLength < 2) break;
    offset += segmentLength;
  }

  throw new Error('JPEG dimensions could not be read');
}

function parseArguments(argv) {
  const result = {
    projects: [],
    states: ['stable', 'latest'],
    profiles: Object.keys(captureProfiles),
    buildLatest: true,
    reuseLive: false,
    allowPartial: false,
    check: false,
    list: false,
    help: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--project') {
      result.projects.push(requireValue(argv, ++index, '--project'));
    } else if (argument.startsWith('--project=')) {
      result.projects.push(argument.slice('--project='.length));
    } else if (argument === '--state') {
      result.states = parseStates(requireValue(argv, ++index, '--state'));
    } else if (argument.startsWith('--state=')) {
      result.states = parseStates(argument.slice('--state='.length));
    } else if (argument === '--profiles') {
      result.profiles = parseProfiles(requireValue(argv, ++index, '--profiles'));
    } else if (argument.startsWith('--profiles=')) {
      result.profiles = parseProfiles(argument.slice('--profiles='.length));
    } else if (argument === '--local') {
      result.states = ['latest'];
    } else if (argument === '--no-build') {
      result.buildLatest = false;
    } else if (argument === '--reuse-live') {
      result.reuseLive = true;
    } else if (argument === '--allow-partial') {
      result.allowPartial = true;
    } else if (argument === '--strict') {
      result.allowPartial = false;
    } else if (argument === '--check') {
      result.check = true;
    } else if (argument === '--list') {
      result.list = true;
    } else if (argument === '--help' || argument === '-h') {
      result.help = true;
    } else if (!argument.startsWith('-')) {
      result.projects.push(argument);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  return result;
}

function parseStates(value) {
  if (value === 'both') return ['stable', 'latest'];
  if (value === 'stable' || value === 'latest') return [value];
  throw new Error(`Unknown state: ${value}. Use stable, latest, or both.`);
}

function parseProfiles(value) {
  const names = value === 'all'
    ? Object.keys(captureProfiles)
    : value.split(',').map((item) => item.trim()).filter(Boolean);
  const unknown = names.filter((name) => !captureProfiles[name]);
  if (unknown.length > 0) throw new Error(`Unknown capture profile(s): ${unknown.join(', ')}`);
  if (names.length === 0) throw new Error('At least one capture profile is required');
  return [...new Set(names)];
}

function selectProjects(allProjects, selectedSlugs) {
  if (selectedSlugs.length === 0) return allProjects;
  const uniqueSlugs = [...new Set(selectedSlugs)];
  const selected = uniqueSlugs.map((slug) => allProjects.find((project) => project.slug === slug));
  const missing = uniqueSlugs.filter((_, index) => !selected[index]);
  if (missing.length > 0) throw new Error(`Unknown project slug(s): ${missing.join(', ')}`);
  return selected;
}

function requireValue(argv, index, label) {
  const value = argv[index];
  if (!value || value.startsWith('-')) throw new Error(`${label} requires a value`);
  return value;
}

async function isLocalDirectory(value) {
  if (!value || /^https?:\/\//i.test(value)) return false;
  try {
    return (await fs.stat(value)).isDirectory();
  } catch {
    return false;
  }
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function loadManifest() {
  try {
    const parsed = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    return {
      schemaVersion: parsed.schemaVersion,
      generatedAt: parsed.generatedAt,
      profiles: profileManifest(),
      projects: parsed.projects || {}
    };
  } catch {
    return {
      schemaVersion: manifestSchemaVersion,
      generatedAt: undefined,
      profiles: profileManifest(),
      projects: {}
    };
  }
}

async function writeManifest(manifest) {
  const temporaryPath = `${manifestPath}.tmp`;
  const normalized = {
    schemaVersion: manifestSchemaVersion,
    generatedAt: manifest.generatedAt,
    profiles: profileManifest(),
    projects: Object.fromEntries(
      Object.entries(manifest.projects).sort(([left], [right]) => left.localeCompare(right))
    )
  };
  await fs.writeFile(temporaryPath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
  await fs.rename(temporaryPath, manifestPath);
}

function profileManifest() {
  return Object.fromEntries(
    Object.entries(captureProfiles).map(([name, profile]) => [name, {
      label: profile.label,
      width: profile.width,
      height: profile.height,
      fullPage: profile.fullPage,
      format: 'jpeg',
      quality: profile.quality
    }])
  );
}

function printSummary(selectedProjects, options, failures) {
  const requestedImages = selectedProjects.length * options.states.length * options.profiles.length;
  console.log(`\nRequested ${requestedImages} image(s).`);
  console.log(`Manifest: ${toPosix(path.relative(portfolioRoot, manifestPath))}`);
  if (failures.length > 0) {
    console.error(`${failures.length} state(s) incomplete:`);
    for (const failure of failures) console.error(`- ${failure}`);
    if (options.allowPartial) console.warn('Partial results were allowed by --allow-partial.');
  } else {
    console.log(`PASS ${selectedProjects.length} project(s) across ${options.states.join(' + ')}`);
  }
}

function printCaptureTargets(selectedProjects) {
  for (const project of selectedProjects) {
    const stable = captureOptionsFor(project, 'stable');
    const latest = captureOptionsFor(project, 'latest');
    const routes = stable.route === latest.route
      ? stable.route
      : `stable=${stable.route}, latest=${latest.route}`;
    console.log(`${project.slug.padEnd(30)} ${routes}`);
  }
  console.log(`\n${selectedProjects.length} project-specific capture target(s).`);
}

function printHelp() {
  console.log(`Generate deterministic portfolio screenshots with Playwright.

Usage:
  npm run images:refresh
  npm run images:refresh -- --project vyb-chess
  npm run images:stable
  npm run images:latest -- --profiles card,mobile
  npm run images:check

Options:
  --project <slug>       Capture one project; repeat for several projects.
  --state <value>        stable, latest, or both (default: both).
  --profiles <list>      card,desktop,mobile,full or all (default: all).
  --no-build             Reuse existing build output instead of rebuilding.
  --reuse-live           Explicitly trust and capture the configured local server.
  --allow-partial        Keep exit code 0 when one or more captures fail.
  --check                Verify files, exact dimensions, hashes, and manifest status.
  --list                 List every configured project-specific capture route.
  --help                 Show this help.

Stable uses deploymentUrl. Latest rebuilds and serves the current repository on an
isolated port unless --reuse-live is explicit. Every latest capture records Git HEAD,
branch, and dirty state in public/project-shots/capture-manifest.json.`);
}

function resolveCaptureUrl(sourceUrl, route) {
  const source = new URL(sourceUrl);
  return new URL(route, `${source.protocol}//${source.host}/`).href;
}

function captureUrlUsesRoute(captureUrl, route) {
  try {
    const actual = new URL(captureUrl);
    const expected = new URL(route, 'https://capture.invalid/');
    return actual.pathname === expected.pathname
      && actual.search === expected.search
      && actual.hash === expected.hash;
  } catch {
    return false;
  }
}

function toPosix(value) {
  return value.split(path.sep).join('/');
}
