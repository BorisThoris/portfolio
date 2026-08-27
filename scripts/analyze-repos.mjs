import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readProjects } from './project-runtime.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const portfolioRoot = path.resolve(scriptDir, '..');
const reposRoot = path.resolve(portfolioRoot, '..');
const analysisPath = path.join(portfolioRoot, 'src', 'repo-analysis.json');
const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
const projects = readProjects();

const projectByRepo = new Map(projects.map((project) => [path.basename(project.repoPath).toLowerCase(), project]));
const analysisByRepo = new Map(analysis.map((entry) => [entry.repoName.toLowerCase(), entry]));
const groupedAnalysis = analysis.find((entry) => entry.slug === 'non-web-local-folders');

const discoveredRepos = fs.readdirSync(reposRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => ({
    repo: entry.name,
    repoPath: path.join(reposRoot, entry.name)
  }));
const configuredExternalRepos = projects
  .filter((project) => path.isAbsolute(project.repoPath))
  .filter((project) => !isInside(project.repoPath, reposRoot))
  .filter((project) => fs.existsSync(project.repoPath))
  .map((project) => ({
    repo: path.basename(project.repoPath),
    repoPath: project.repoPath
  }));
const repoCandidates = new Map(
  [...discoveredRepos, ...configuredExternalRepos]
    .map((entry) => [path.resolve(entry.repoPath).toLowerCase(), entry])
);
const rows = [...repoCandidates.values()]
  .map((entry) => inspectRepo(entry.repo, entry.repoPath))
  .sort((left, right) => right.priorityScore - left.priorityScore || left.repo.localeCompare(right.repo));

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(rows, null, 2));
} else {
  printTable(rows);
  const visible = rows.filter((row) => row.tier === 'showcase' || row.tier === 'more').length;
  const excluded = rows.length - visible;
  console.log(`\nScanned ${rows.length} directories: ${visible} visible portfolio projects, ${excluded} excluded/duplicate/support repos.`);
}

function inspectRepo(repo, repoPath) {
  const packagePath = path.join(repoPath, 'package.json');
  const packageJson = readJson(packagePath);
  const project = projectByRepo.get(repo.toLowerCase());
  const curated = analysisByRepo.get(repo.toLowerCase()) ?? findGrouped(repo);
  const scripts = packageJson?.scripts ? Object.keys(packageJson.scripts) : [];
  const dependencies = {
    ...packageJson?.dependencies,
    ...packageJson?.devDependencies
  };
  const metrics = collectMetrics(repoPath);

  const inferred = inferRepo({ repo, packageJson, scripts, dependencies, metrics });
  const priorityScore = curated?.priorityScore ?? inferred.priorityScore;
  const tier = curated?.showcaseTier ?? inferred.tier;
  return {
    repo,
    packageName: packageJson?.name ?? '',
    tier,
    priorityScore,
    currentPortfolioEntry: project?.slug ?? '',
    duplicateOf: curated?.duplicateOf ?? '',
    excludedReason: tier === 'excluded' ? (curated?.excludedReason ?? inferred.excludedReason) : '',
    scripts: scripts.join(', '),
    framework: detectFramework(dependencies, scripts),
    sourceFiles: metrics.sourceFiles,
    testFiles: metrics.testFiles,
    hasReadme: metrics.hasReadme,
    analysisNotes: curated?.analysisNotes ?? inferred.analysisNotes
  };
}

function isInside(candidatePath, rootPath) {
  const relative = path.relative(rootPath, candidatePath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function inferRepo({ repo, packageJson, scripts, dependencies, metrics }) {
  if (!packageJson) {
    return {
      tier: 'excluded',
      priorityScore: 0,
      excludedReason: 'No package.json detected.',
      analysisNotes: 'No Node web app metadata was found.'
    };
  }

  const hasWebFramework = Boolean(
    dependencies.react ||
    dependencies['@angular/core'] ||
    dependencies.vite ||
    dependencies.next ||
    dependencies.phaser ||
    dependencies.express
  );
  const hasBuild = scripts.includes('build');
  const hasStart = scripts.includes('start') || scripts.includes('dev');

  if (!hasWebFramework || (!hasBuild && !hasStart)) {
    return {
      tier: 'excluded',
      priorityScore: 0,
      excludedReason: 'No demoable web-app build/start surface detected.',
      analysisNotes: 'Package exists, but it does not look like a runnable portfolio web app.'
    };
  }

  const priorityScore = Math.min(
    72,
    30 +
      scripts.length * 2 +
      Object.keys(dependencies).length +
      Math.min(18, Math.floor(metrics.sourceFiles / 10)) +
      Math.min(8, metrics.testFiles)
  );
  return {
    tier: 'more',
    priorityScore,
    excludedReason: '',
    analysisNotes: `Detected a runnable web candidate from ${repo}; add curated scoring before promoting.`
  };
}

function collectMetrics(repoPath) {
  const sourceExtensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.css', '.scss', '.html', '.vue', '.svelte']);
  const ignored = new Set(['node_modules', 'dist', 'build', '.git', '.wrangler', 'coverage', '.next', 'out']);
  let sourceFiles = 0;
  let testFiles = 0;
  let hasReadme = false;

  walk(repoPath);
  return { sourceFiles, testFiles, hasReadme };

  function walk(dir) {
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (ignored.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (/^readme\./i.test(entry.name)) hasReadme = true;
      const ext = path.extname(entry.name).toLowerCase();
      if (!sourceExtensions.has(ext)) continue;
      sourceFiles += 1;
      if (/(^|[.\-_])(test|spec|e2e)([.\-_]|$)/i.test(entry.name) || fullPath.includes(`${path.sep}tests${path.sep}`)) {
        testFiles += 1;
      }
    }
  }
}

function detectFramework(dependencies, scripts) {
  if (dependencies['@angular/core']) return 'Angular';
  if (dependencies.next) return 'Next.js';
  if (dependencies.phaser) return 'Phaser';
  if (dependencies['@react-three/fiber']) return 'React Three Fiber';
  if (dependencies.react) return 'React';
  if (dependencies.electron || scripts.some((script) => script.includes('electron'))) return 'Electron';
  if (dependencies.express) return 'Express';
  return '';
}

function findGrouped(repo) {
  if (!groupedAnalysis) return null;
  const names = groupedAnalysis.repoName.split(',').map((item) => item.trim().toLowerCase());
  return names.includes(repo.toLowerCase()) ? groupedAnalysis : null;
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function printTable(items) {
  const columns = [
    ['repo', 'repo'],
    ['tier', 'tier'],
    ['score', 'priorityScore'],
    ['portfolio', 'currentPortfolioEntry'],
    ['src', 'sourceFiles'],
    ['tests', 'testFiles'],
    ['framework', 'framework'],
    ['excluded/duplicate', 'excludedReason']
  ];
  const widths = Object.fromEntries(columns.map(([label, key]) => [
    label,
    Math.max(label.length, ...items.map((item) => String(item[key] ?? '').length))
  ]));

  console.log(columns.map(([label]) => label.padEnd(widths[label])).join('  '));
  console.log(columns.map(([label]) => '-'.repeat(widths[label])).join('  '));
  for (const item of items) {
    console.log(columns.map(([label, key]) => String(item[key] ?? '').padEnd(widths[label])).join('  '));
  }
}
