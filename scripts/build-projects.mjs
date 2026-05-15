import { buildProject, readProjects } from './project-runtime.mjs';

const projects = readProjects();
const selected = getSelectedSlugs();
const targets = selected.length > 0
  ? projects.filter((project) => selected.includes(project.slug))
  : projects;

if (selected.length > 0 && targets.length !== selected.length) {
  const known = new Set(projects.map((project) => project.slug));
  const missing = selected.filter((slug) => !known.has(slug));
  console.error(`Unknown project slug(s): ${missing.join(', ')}`);
  process.exit(1);
}

const results = [];

for (const project of targets) {
  console.log(`\n[build] ${project.slug}`);
  const result = await buildProject(project);
  results.push(result);
  if (result.ok) {
    console.log(`[pass] ${project.slug} -> ${result.output}`);
  } else if (result.skipped) {
    console.log(`[skip] ${project.slug}: ${result.reason}`);
  } else {
    console.log(`[fail] ${project.slug}: ${result.command} exited ${result.code}`);
  }
}

const failed = results.filter((result) => !result.ok);
console.log('\nBuild summary');
for (const result of results) {
  console.log(`${result.ok ? 'PASS' : 'FAIL'} ${result.slug}`);
}

process.exit(failed.length > 0 ? 1 : 0);

function getSelectedSlugs() {
  const slugs = [];
  for (let index = 2; index < process.argv.length; index += 1) {
    const arg = process.argv[index];
    if (arg === '--project' && process.argv[index + 1]) {
      slugs.push(process.argv[index + 1]);
      index += 1;
    } else if (!arg.startsWith('-')) {
      slugs.push(arg);
    }
  }
  return slugs;
}
