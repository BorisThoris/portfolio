import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { test } from 'node:test';

const template = fileURLToPath(new URL('./template/', import.meta.url));
const script = process.env.PROJECT_TRAILERS_SCRIPT || path.join(template, 'build-project-trailers.mjs');
const library = process.env.PROJECT_MEDIA_LIB || path.join(template, 'project-media-lib.mjs');
const { resolveBaseUrl, recordRecipe } = await import(pathToFileURL(library).href);
const hash = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

function fixture(t, { source = 'deployment', fresh = false, legacy = false, deploymentUrl = null } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'trailer-check-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const dir of ['scripts', 'public/trailers', 'project-media']) fs.mkdirSync(path.join(root, dir), { recursive: true });
  fs.copyFileSync(script, path.join(root, 'scripts/build-project-trailers.mjs'));
  fs.copyFileSync(library, path.join(root, 'scripts/project-media-lib.mjs'));
  execFileSync('git', ['init', '--quiet'], { cwd: root, stdio: 'pipe' });
  const item = { id: 'tour', kind: 'capture', source, inputs: [], recipe: { durationMs: 20000 } };
  const { inputs, ...settings } = item;
  const record = {
    id: 'tour', builtAt: '2026-10-29T00:00:00Z', file: 'public/trailers/tour.mp4', bytes: 4,
    inputsHash: fresh ? hash({ recipe: item.recipe, music: null, source }) : 'previous-source-hash',
    ...(legacy ? {} : { captureSettingsHash: hash({ settings, deploymentUrl,
      publishDirRelative: 'public/trailers', urlPathPrefix: '/trailers/', maxBytes: 20 * 1024 * 1024, musicHash: null }) })
  };
  const writeConfig = () => fs.writeFileSync(path.join(root, 'scripts/project-meta.config.mjs'),
    `export default ${JSON.stringify({ slug: 'fixture', curated: { deploymentUrl }, trailers: { items: [item] } })};`);
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

test('an explicit URL wins over deployment selection and invalid URLs never fall back', async () => {
  const config = { curated: { deploymentUrl: 'https://production.example/' } };
  const selected = await resolveBaseUrl(config, '.', { source: 'deployment', url: 'https://preview.example/' });
  assert.equal(selected.url, 'https://preview.example/');
  assert.equal(selected.source, 'explicit');
  for (const url of ['', 'not a URL', 'file:///C:/project', 'https://user:password@example.com/'])
    await assert.rejects(resolveBaseUrl(config, '.', { source: 'deployment', url }), /explicit capture URL/i);
});

test('muted capture stays headless and a failed preview never navigates to production', async t => {
  const { root } = fixture(t);
  const visited = [];
  let launchOptions;
  let closed = false;
  const chromium = { launch: async options => {
    launchOptions = options;
    return {
      newContext: async () => ({
        newPage: async () => ({
          goto: async url => { visited.push(url); throw new Error('preview unavailable'); },
          video: () => null
        }),
        close: async () => {}
      }),
      close: async () => { closed = true; }
    };
  } };
  await assert.rejects(recordRecipe(chromium, {
    url: 'https://unavailable.example/', recipe: { route: '/#/editor', browserArgs: ['--test-flag'] },
    outDir: root, muteAudio: true
  }), /preview unavailable/);
  assert.deepEqual(visited, ['https://unavailable.example/#/editor']);
  assert.deepEqual(launchOptions, { headless: true, args: ['--test-flag', '--mute-audio'] });
  assert.equal(closed, true);
});

function captureFixture(t) {
  const state = fixture(t, { deploymentUrl: 'https://production.example/' });
  const { root } = state;
  state.item.inputs = ['app.txt'];
  state.writeConfig();
  fs.writeFileSync(path.join(root, 'app.txt'), 'pinned application');
  fs.copyFileSync(library, path.join(root, 'scripts/real-media-lib.mjs'));
  fs.writeFileSync(path.join(root, 'scripts/project-media-lib.mjs'), `
    import fs from 'node:fs'; import path from 'node:path';
    export { resolveBaseUrl, assessFrame } from './real-media-lib.mjs';
    export const loadChromium = async () => ({});
    export async function recordRecipe(browser, options) {
      fs.writeFileSync('capture-options.json', JSON.stringify(options));
      const videoPath = path.join(options.outDir, 'recorded.webm');
      fs.writeFileSync(videoPath, 'video');
      return { videoPath, skipped: [], stats: { std: 50, dark: 0.3, light: 0, colours: 20 } };
    }
  `);
  fs.writeFileSync(path.join(root, 'fake-encoder.mjs'), `
    import cp from 'node:child_process'; import fs from 'node:fs';
    import { syncBuiltinESMExports } from 'node:module';
    const spawnSync = cp.spawnSync;
    cp.spawnSync = (command, args, options) => {
      if (command === 'ffmpeg') { fs.writeFileSync(args.at(-1), 'encoded'); return { status: 0 }; }
      if (command === 'ffprobe') return { status: 0, stdout: JSON.stringify({
        streams: [{ codec_type: 'video', width: 1280, height: 720, r_frame_rate: '30/1' }], format: { duration: '20' }
      }) };
      return spawnSync(command, args, options);
    };
    syncBuiltinESMExports();
  `);
  execFileSync('git', ['add', '.'], { cwd: root });
  execFileSync('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid',
    'commit', '--quiet', '-m', 'fixture'], { cwd: root });
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const capture = (...extra) => spawnSync(process.execPath, ['--import', './fake-encoder.mjs',
    'scripts/build-project-trailers.mjs', '--force', ...extra], { cwd: root, encoding: 'utf8', timeout: 30000 });
  return { ...state, commit, capture };
}

test('fresh capture records actual URL, application commit and tool fingerprint without changing recipe hash', t => {
  const { root, record, commit, capture } = captureFixture(t);
  const result = capture('--url=https://preview.example/', `--source-commit=${commit}`, '--mute-audio');
  assert.equal(result.status, 0, result.stderr);
  const options = JSON.parse(fs.readFileSync(path.join(root, 'capture-options.json')));
  assert.equal(options.url, 'https://preview.example/');
  assert.equal(options.muteAudio, true);
  const saved = JSON.parse(fs.readFileSync(path.join(root, 'project-media/trailers.json'))).items[0];
  assert.equal(saved.captureSettingsHash, record.captureSettingsHash);
  assert.deepEqual({ ...saved.captureProvenance, toolHash: undefined }, {
    url: 'https://preview.example/', sourceCommit: commit, muted: true, toolHash: undefined
  });
  assert.match(saved.captureProvenance.toolHash, /^[a-f0-9]{64}$/);
  const reencoded = capture('--no-build');
  assert.equal(reencoded.status, 0, reencoded.stderr);
  const reused = JSON.parse(fs.readFileSync(path.join(root, 'project-media/trailers.json'))).items[0];
  assert.deepEqual(reused.captureProvenance, saved.captureProvenance);
});

test('a source commit cannot label modified application inputs as that commit', t => {
  const { root, commit, capture } = captureFixture(t);
  fs.writeFileSync(path.join(root, 'app.txt'), 'newer uncommitted application');
  const result = capture('--url=https://preview.example/', `--source-commit=${commit}`);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /inputs differ/);
  assert.equal(fs.existsSync(path.join(root, 'capture-options.json')), false);
});

test('invalid runtime provenance fails before recording or replacing published media', t => {
  const { root, capture } = captureFixture(t);
  for (const args of [ ['--url'], ['--source-commit'], ['--url='], ['--url=file:///private'], [`--source-commit=${'0'.repeat(40)}`],
    ['--no-build', '--url=https://preview.example/'] ]) {
    const result = capture(...args);
    assert.notEqual(result.status, 0, result.stdout);
    assert.equal(fs.existsSync(path.join(root, 'capture-options.json')), false);
    assert.equal(fs.readFileSync(path.join(root, 'public/trailers/tour.mp4'), 'utf8'), 'data');
  }
});
