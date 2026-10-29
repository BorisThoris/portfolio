import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const generator = process.env.PROJECT_META_GENERATOR || fileURLToPath(new URL('./template/generate-project-meta.mjs', import.meta.url));
const run = (root, ...args) => execFileSync(process.execPath, ['scripts/generate-project-meta.mjs', ...args], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 30000 });

function fixture(parent, name, media) {
  const root = path.join(parent, name, 'project');
  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
  fs.copyFileSync(generator, path.join(root, 'scripts/generate-project-meta.mjs'));
  fs.writeFileSync(path.join(root, 'scripts/project-meta.config.mjs'), `export default ${JSON.stringify({ slug: 'fixture', curated: { title: 'Fixture' }, media })};`);
  fs.writeFileSync(path.join(root, 'package.json'), '{"name":"fixture","version":"1.0.0"}');
  execFileSync('git', ['init', '--quiet'], { cwd: root, stdio: 'pipe' });
  return root;
}

test('repo-local media metadata survives moving to another checkout', (t) => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'meta-portability-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const first = fixture(temp, 'first');
  const second = fixture(temp, 'second');
  for (const root of [first, second]) fs.mkdirSync(path.join(root, 'project-media'));
  run(first);
  const metadata = JSON.parse(fs.readFileSync(path.join(first, 'project.meta.json'), 'utf8'));
  assert.equal(metadata.media.directory, 'project-media');
  fs.copyFileSync(path.join(first, 'project.meta.json'), path.join(second, 'project.meta.json'));
  assert.match(run(second, '--check'), /up to date/);
});

test('external portfolio captures keep their absolute location', (t) => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'meta-external-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const external = path.join(temp, 'captures');
  fs.mkdirSync(external);
  const root = fixture(temp, 'repo', { sourceDir: external });
  assert.equal(JSON.parse(run(root, '--json')).media.directory, external.replaceAll('\\', '/'));
});
