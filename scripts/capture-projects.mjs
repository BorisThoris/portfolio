import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const registryPath = path.resolve('src', 'project-data.json');
const projects = JSON.parse(await fs.readFile(registryPath, 'utf8'));

const projectArgIndex = process.argv.indexOf('--project');
const positionalSlug = process.argv.slice(2).find((arg) => !arg.startsWith('-'));
const selectedSlug = projectArgIndex >= 0 ? process.argv[projectArgIndex + 1] : positionalSlug;
const targets = selectedSlug ? projects.filter((project) => project.slug === selectedSlug) : projects;

if (selectedSlug && targets.length === 0) {
  console.error(`Unknown project: ${selectedSlug}`);
  process.exit(1);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

for (const project of targets) {
  const outputDir = path.resolve('public', 'project-shots', project.slug);
  const outputPath = path.join(outputDir, 'main.png');
  await fs.mkdir(outputDir, { recursive: true });

  try {
    const response = await page.goto(project.localUrl, { waitUntil: 'networkidle', timeout: 20000 });
    if (!response?.ok()) {
      console.warn(`[skip] ${project.slug}: ${project.localUrl} returned ${response?.status() ?? 'no response'}`);
      continue;
    }

    await page.waitForTimeout(1500);
    await page.screenshot({ path: outputPath, fullPage: false });
    console.log(`[captured] ${project.slug} -> ${outputPath}`);
  } catch (error) {
    console.warn(`[skip] ${project.slug}: ${error.message}`);
  }
}

await browser.close();
