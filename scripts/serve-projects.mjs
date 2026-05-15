import { spawn } from 'node:child_process';
import {
  buildProject,
  findBuildOutput,
  hasUsableBuild,
  parseUrl,
  portfolioRoot,
  probeUrl,
  readProjects,
  removeRuntimeStatus,
  startCommandServer,
  startStaticServer,
  waitForUrl,
  writeRuntimeStatus
} from './project-runtime.mjs';

const mode = process.argv.includes('--builds') ? 'builds' : 'live';
const projects = readProjects();
const servers = [];
const statuses = [];

for (const project of projects) {
  const liveProbe = mode === 'live' ? await probeUrl(project.localUrl) : { ok: false, status: 'not checked' };

  if (liveProbe.ok) {
    statuses.push(statusFor(project, 'live', project.localUrl, liveProbe.status));
    console.log(`[live] ${project.slug} -> ${project.localUrl}`);
    continue;
  }

  if (!hasUsableBuild(project)) {
    console.log(`[build] ${project.slug}`);
    const build = await buildProject(project);
    if (!build.ok) {
      statuses.push(statusFor(project, 'failed', project.localUrl, build.code || 'build failed'));
      continue;
    }
  }

  try {
    const server = project.fallbackCommand
      ? startCommandServer(project)
      : startStaticServer(project, findBuildOutput(project));
    servers.push(server);
    const ready = await waitForUrl(project.localUrl);
    statuses.push(statusFor(project, ready.ok ? 'build' : 'failed', project.localUrl, ready.status));
    console.log(`[build] ${project.slug} -> ${project.localUrl}`);
  } catch (error) {
    statuses.push(statusFor(project, 'failed', project.localUrl, error.message));
    console.log(`[fail] ${project.slug}: ${error.message}`);
  }
}

await writeRuntimeStatus(statuses);
console.log(`[portfolio] runtime status written for ${statuses.length} projects`);

const portfolioUrl = 'http://127.0.0.1:4110/';
const portfolioProbe = await probeUrl(portfolioUrl);
let portfolio = null;

if (portfolioProbe.ok) {
  console.log(`[portfolio] reusing ${portfolioUrl}`);
} else {
  portfolio = spawn('npm run dev -- --host 127.0.0.1 --port 4110', {
    cwd: portfolioRoot,
    shell: true,
    stdio: 'inherit'
  });
  servers.push({ close: () => portfolio.kill(), label: 'portfolio vite' });
  console.log(`[portfolio] ${portfolioUrl}`);
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    cleanup();
    process.exit(0);
  });
}

if (portfolio) {
  portfolio.on('exit', (code) => {
    cleanup();
    process.exit(code ?? 0);
  });
}

function statusFor(project, modeValue, effectiveUrl, probeStatus) {
  const parsed = parseUrl(effectiveUrl);
  return {
    slug: project.slug,
    mode: modeValue,
    effectiveUrl,
    origin: parsed.origin,
    status: probeStatus
  };
}

function cleanup() {
  for (const server of servers.reverse()) {
    try {
      server.close();
    } catch {
      // best effort shutdown
    }
  }
  removeRuntimeStatus();
}
