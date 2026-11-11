// Checks every public demo link and records the result in src/project-health.json,
// which drives the status light in the project index ("Live" or "Not responding").
//
//   node scripts/check-deployments.mjs            dry run
//   node scripts/check-deployments.mjs --write    write the file (once a day unless --force)
//
// A link counts as up when it answers 2xx/3xx within 20 s (one retry). A demo is shown
// as down only after it has failed on two consecutive daily checks, so one flaky
// request never flips a working project to "down".
import fs from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const write = process.argv.includes('--write');
const force = process.argv.includes('--force');
const today = new Date().toISOString().slice(0, 10);
const healthFile = new URL('src/project-health.json', root);
const projects = JSON.parse(await fs.readFile(new URL('src/project-data.json', root), 'utf8'));
const access = JSON.parse(await fs.readFile(new URL('src/project-access.json', root), 'utf8'));
const previous = JSON.parse(await fs.readFile(healthFile, 'utf8').catch(() => '{"checkedAt":null,"projects":{}}'));
if (write && !force && previous.checkedAt === today) {
  console.log(`Already checked today (${today}); pass --force to recheck.`);
  process.exit(0);
}

async function probe(url) {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20000), headers: { 'user-agent': 'portfolio-link-check/1.0' } });
      if (response.status < 400) return { ok: true, status: response.status };
      if (attempt === 2) return { ok: false, status: response.status };
    } catch (error) {
      if (attempt === 2) return { ok: false, status: error.name === 'TimeoutError' ? 'timeout' : 'unreachable' };
    }
  }
}

const next = { checkedAt: today, projects: {} };
const lines = [];
for (const project of projects) {
  const entry = access[project.slug];
  if (!project.deploymentUrl || (entry && entry.kind !== 'web')) continue;
  const result = await probe(project.deploymentUrl);
  const before = previous.projects[project.slug];
  const failures = result.ok ? 0 : (before?.failures ?? 0) + 1;
  next.projects[project.slug] = {
    url: project.deploymentUrl,
    up: result.ok || failures < 2,
    status: result.status,
    failures,
    lastUp: result.ok ? today : before?.lastUp ?? null,
  };
  lines.push(`${result.ok ? 'up  ' : 'DOWN'} ${result.status} ${project.slug} ${project.deploymentUrl}${!result.ok ? ` (failures in a row: ${failures})` : ''}`);
}
console.log(lines.join('\n'));
if (write) {
  await fs.writeFile(healthFile, JSON.stringify(next, null, 2).replace(/\n/g, '\r\n') + '\r\n');
  console.log(`Wrote src/project-health.json (${Object.keys(next.projects).length} demos).`);
}
