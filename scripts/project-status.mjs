import {
  findBuildOutput,
  hasUsableBuild,
  probeUrl,
  readProjects
} from './project-runtime.mjs';

const projects = readProjects();
const rows = [];

for (const project of projects) {
  const live = await probeUrl(project.localUrl);
  rows.push({
    slug: project.slug,
    port: new URL(project.localUrl).port,
    live: live.ok ? `yes (${live.status})` : `no (${live.status})`,
    build: hasUsableBuild(project) ? 'yes' : 'no',
    output: findBuildOutput(project) || ''
  });
}

const widths = {
  slug: Math.max('project'.length, ...rows.map((row) => row.slug.length)),
  port: Math.max('port'.length, ...rows.map((row) => row.port.length)),
  live: Math.max('live'.length, ...rows.map((row) => row.live.length)),
  build: 'build'.length
};

console.log(`${pad('project', widths.slug)}  ${pad('port', widths.port)}  ${pad('live', widths.live)}  ${pad('build', widths.build)}  output`);
console.log(`${'-'.repeat(widths.slug)}  ${'-'.repeat(widths.port)}  ${'-'.repeat(widths.live)}  ${'-'.repeat(widths.build)}  ------`);
for (const row of rows) {
  console.log(`${pad(row.slug, widths.slug)}  ${pad(row.port, widths.port)}  ${pad(row.live, widths.live)}  ${pad(row.build, widths.build)}  ${row.output}`);
}

function pad(value, width) {
  return String(value).padEnd(width, ' ');
}
