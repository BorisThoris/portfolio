import { spawn } from 'node:child_process';
import {
  parseUrl,
  portfolioRoot,
  probeUrl,
  readProjects,
  waitForUrl,
  writeRuntimeStatus
} from './project-runtime.mjs';

const projects = readProjects();
const processes = [];
const statuses = [];

for (const project of projects) {
  const before = await probeUrl(project.localUrl, 900);
  if (before.ok) {
    statuses.push(statusFor(project, 'live', before.status));
    console.log(`[reuse] ${project.slug} -> ${project.localUrl}`);
    continue;
  }

  console.log(`[start] ${project.slug}: ${project.runCommand}`);
  const parsed = parseUrl(project.localUrl);
  const child = spawn(project.runCommand, {
    cwd: project.repoPath,
    env: {
      ...process.env,
      BROWSER: 'none',
      HOST: parsed.host || '127.0.0.1',
      PORT: String(parsed.port)
    },
    shell: true,
    stdio: 'inherit'
  });
  processes.push(child);

  const ready = await waitForUrl(project.localUrl, 45000);
  statuses.push(statusFor(project, ready.ok ? 'live' : 'failed', ready.status));
  console.log(`[${ready.ok ? 'live' : 'fail'}] ${project.slug} -> ${project.localUrl} (${ready.status})`);
}

await writeRuntimeStatus(statuses);

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
  processes.push(portfolio);
  console.log(`[portfolio] ${portfolioUrl}`);
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    for (const child of processes.reverse()) {
      try {
        child.kill();
      } catch {
        // best effort shutdown
      }
    }
    process.exit(0);
  });
}

if (portfolio) {
  portfolio.on('exit', (code) => process.exit(code ?? 0));
}

function statusFor(project, mode, probeStatus) {
  const parsed = parseUrl(project.localUrl);
  return {
    slug: project.slug,
    mode,
    effectiveUrl: project.localUrl,
    origin: parsed.origin,
    status: probeStatus
  };
}
