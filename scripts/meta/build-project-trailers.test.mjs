import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const template = fileURLToPath(new URL('./template/', import.meta.url));
const script = process.env.PROJECT_TRAILERS_SCRIPT || path.join(template, 'build-project-trailers.mjs');
const hash = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

function fixture(t, { source = 'deployment', fresh = false, legacy = false } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'trailer-check-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const dir of ['scripts', 'public/trailers', 'project-media']) fs.mkdirSync(path.join(root, dir), { recursive: true });
  fs.copyFileSync(script, path.join(root, 'scripts/build-project-trailers.mjs'));
  fs.copyFileSync(path.join(template, 'project-media-lib.mjs'), path.join(root, 'scripts/project-media-lib.mjs'));
  execFileSync('git', ['init', '--quiet'], { cwd: root, stdio: 'pipe' });
  const item = { id: 'tour', kind: 'capture', source, inputs: [], recipe: { durationMs: 20000 } };
  const { inputs, ...settings } = item;
  const record = {
    id: 'tour', builtAt: '2026-10-29T00:00:00Z', file: 'public/trailers/tour.mp4', bytes: 4,
    inputsHash: fresh ? hash({ recipe: item.recipe, music: null, source }) : 'previous-source-hash',
    ...(legacy ? {} : { captureSettingsHash: hash({ settings, deploymentUrl: null,
      publishDirRelative: 'public/trailers', urlPathPrefix: '/trailers/', maxBytes: 20 * 1024 * 1024, musicHash: null }) })
  };
  const writeConfig = () => fs.writeFileSync(path.join(root, 'scripts/project-meta.config.mjs'),
    `export default ${JSON.stringify({ slug: 'fixture', trailers: { items: [item] } })};`);
  const writeRecord = () => fs.writeFileSync(path.join(root, 'project-media/trailers.json'), JSON.stringify({ items: [record] }));
  writeConfig();
  writeRecord();
  fs.writeFileSync(path.join(root, record.file), 'data');
  return { root, item, record, writeConfig, writeRecord };
}

function check(root, defer = true) {
  return spawnSync(process.execPath, ['scripts/build-project-trailers.mjs', '--check', '--buildable-only',
    ...(defer ? ['--defer-deployment-freshness'] : [])], { cwd: root, encoding: 'utf8', timeout: 30000 });
}

test('push check defers only source freshness of an existing deployment capture', t => {
  const { root } = fixture(t);
  const push = check(root);
  assert.equal(push.status, 0, push.stderr);
  assert.match(push.stderr, /freshness deferred/);
  assert.match(push.stdout, /await refresh/);
  assert.doesNotMatch(push.stdout, /all rendered media is current/);
  const afterDeploy = check(root, false);
  assert.equal(afterDeploy.status, 1);
  assert.match(afterDeploy.stderr, /inputs changed/);
});

test('a current capture passes the strict post-deployment check', t => {
  const { root } = fixture(t, { fresh: true });
  const result = check(root, false);
  assert.equal(result.status, 0, result.stderr);
});

test('a stale local capture still fails the push check', t => {
  const { root } = fixture(t, { source: 'local' });
  assert.equal(check(root).status, 1);
});

test('legacy capture records must establish settings provenance through refresh', t => {
  const { root } = fixture(t, { legacy: true });
  const result = check(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /settings changed or not yet recorded/);
});

test('a changed capture recipe cannot be deferred even without the toolchain', t => {
  const fixtureState = fixture(t);
  fixtureState.item.recipe.durationMs = 40000;
  fixtureState.item.requires = ['this-tool-does-not-exist-trailer-fixture'];
  fixtureState.writeConfig();
  const result = check(fixtureState.root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /settings changed/);
});

for (const defect of ['missing', 'truncated', 'unrecorded']) {
  test(`push deferral still rejects ${defect} media`, t => {
    const { root, record } = fixture(t);
    if (defect === 'missing') fs.rmSync(path.join(root, record.file));
    else if (defect === 'truncated') fs.writeFileSync(path.join(root, record.file), 'x');
    else fs.rmSync(path.join(root, 'project-media/trailers.json'));
    const result = check(root);
    assert.equal(result.status, 1, result.stdout);
    assert.doesNotMatch(result.stderr, /freshness deferred/);
  });
}
