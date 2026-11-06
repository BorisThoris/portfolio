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

// ---- Reconciled behaviour: portable hashing, republish without re-render, incremental shots

const commitAll = (root, message) => {
  execFileSync('git', ['add', '.'], { cwd: root, stdio: 'pipe' });
  execFileSync('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid',
    'commit', '--quiet', '-m', message], { cwd: root, stdio: 'pipe' });
};
const trailers = (root, ...extra) => spawnSync(process.execPath, ['--import', './fake-encoder.mjs',
  'scripts/build-project-trailers.mjs', ...extra], { cwd: root, encoding: 'utf8', timeout: 30000 });

test('a CRLF checkout of the same content keeps a record written from LF current', t => {
  const { root, capture } = captureFixture(t);
  fs.writeFileSync(path.join(root, 'app.txt'), 'line one\nline two\n');
  commitAll(root, 'two lines');
  const built = capture();
  assert.equal(built.status, 0, built.stderr);
  execFileSync('git', ['config', 'core.autocrlf', 'true'], { cwd: root });
  fs.writeFileSync(path.join(root, 'app.txt'), 'line one\r\nline two\r\n');
  const result = check(root, false);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test('committing an unchanged input does not make its render stale', t => {
  const { root, capture } = captureFixture(t);
  fs.writeFileSync(path.join(root, 'app.txt'), 'edited, not yet committed\n');
  const built = capture();
  assert.equal(built.status, 0, built.stderr);
  commitAll(root, 'commit the edit');
  const result = check(root, false);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test('a real content change still makes the render stale', t => {
  const { root, capture } = captureFixture(t);
  assert.equal(capture().status, 0);
  fs.writeFileSync(path.join(root, 'app.txt'), 'a different application\n');
  assert.notEqual(check(root, false).status, 0);
});

test('a missing web copy is re-encoded from the master without recording again', t => {
  const { root, capture } = captureFixture(t);
  assert.equal(capture().status, 0);
  const before = JSON.parse(fs.readFileSync(path.join(root, 'project-media/trailers.json'))).items[0];
  fs.rmSync(path.join(root, before.file));
  fs.rmSync(path.join(root, 'capture-options.json'));
  const result = trailers(root);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(path.join(root, 'capture-options.json')), false, 'no new recording');
  assert.ok(fs.existsSync(path.join(root, before.file)));
  assert.match(result.stdout, /1 republished/);
  const after = JSON.parse(fs.readFileSync(path.join(root, 'project-media/trailers.json'))).items[0];
  assert.deepEqual(after.stats, before.stats);
  assert.deepEqual(after.captureProvenance, before.captureProvenance);
});

test('a provenance override records afresh even when the master could be republished', t => {
  const { root, capture } = captureFixture(t);
  assert.equal(capture().status, 0);
  const before = JSON.parse(fs.readFileSync(path.join(root, 'project-media/trailers.json'))).items[0];
  fs.rmSync(path.join(root, before.file));
  fs.rmSync(path.join(root, 'capture-options.json'));
  const result = trailers(root, '--url=https://preview.example/');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'capture-options.json'))).url, 'https://preview.example/');
});

test('a render-setting change makes a non-capture item stale, a record without one is not', t => {
  const { root, item, record, writeConfig, writeRecord } = fixture(t);
  const output = 'out/tour.mp4';
  Object.assign(item, { kind: 'trailer', output, build: 'node build.mjs', fps: 30 });
  delete item.recipe;
  writeConfig();
  record.inputsHash = 'none';
  delete record.captureSettingsHash;
  record.settingsHash = undefined;
  writeRecord();
  const quiet = spawnSync(process.execPath, ['scripts/build-project-trailers.mjs', '--list'], { cwd: root, encoding: 'utf8', timeout: 30000 });
  assert.equal(quiet.status, 0, quiet.stderr);
  record.settingsHash = 'from-another-configuration';
  writeRecord();
  const listed = spawnSync(process.execPath, ['scripts/build-project-trailers.mjs', '--list'], { cwd: root, encoding: 'utf8', timeout: 30000 });
  assert.match(listed.stdout + listed.stderr, /render settings changed/);
});

function shotsFixture(t, capture = { inputs: ['app.txt'] }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'shots-check-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'scripts'));
  fs.copyFileSync(path.join(template, 'capture-project-shots.mjs'), path.join(root, 'scripts/capture-project-shots.mjs'));
  fs.copyFileSync(library, path.join(root, 'scripts/project-media-lib.mjs'));
  fs.writeFileSync(path.join(root, 'scripts/project-meta.config.mjs'),
    `export default ${JSON.stringify({ slug: 'fixture', curated: {}, capture })};`);
  execFileSync('git', ['init', '--quiet'], { cwd: root, stdio: 'pipe' });
  return root;
}
const shots = (root, ...extra) => spawnSync(process.execPath, ['scripts/capture-project-shots.mjs', ...extra],
  { cwd: root, encoding: 'utf8', timeout: 30000 });

test('a local screenshot fingerprint is the same for LF and CRLF checkouts of one file', t => {
  const root = shotsFixture(t);
  fs.writeFileSync(path.join(root, 'app.txt'), 'line one\nline two\n');
  commitAll(root, 'app');
  const lf = shots(root, '--source=local', '--fingerprint');
  assert.equal(lf.status, 0, lf.stderr);
  execFileSync('git', ['config', 'core.autocrlf', 'true'], { cwd: root });
  fs.writeFileSync(path.join(root, 'app.txt'), 'line one\r\nline two\r\n');
  assert.equal(shots(root, '--source=local', '--fingerprint').stdout, lf.stdout);
  fs.writeFileSync(path.join(root, 'app.txt'), 'changed\r\n');
  assert.notEqual(shots(root, '--source=local', '--fingerprint').stdout, lf.stdout);
});

test('a deployed screenshot fingerprint follows the assets the page serves', async t => {
  const { createServer } = await import('node:http');
  const { promisify } = await import('node:util');
  const { execFile } = await import('node:child_process');
  let asset = 'one';
  const server = createServer((request, response) => response.end(request.url.endsWith('.js') ? asset : '<script src="/app.js"></script>'));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const root = shotsFixture(t, {});
  const url = '--url=http://127.0.0.1:' + server.address().port + '/';
  const print = async () => (await promisify(execFile)(process.execPath,
    ['scripts/capture-project-shots.mjs', url, '--fingerprint'], { cwd: root })).stdout;
  const first = await print();
  assert.equal(await print(), first);
  asset = 'two';
  assert.notEqual(await print(), first);
});

test('a rendered trailer recorded by the previous hash is current and is not rendered again', t => {
  const { root, item, writeConfig } = captureFixture(t);
  const scriptPath = path.join(root, 'scripts/build-project-trailers.mjs');
  const current = fs.readFileSync(scriptPath, 'utf8');
  // The same script, hashing with the previous algorithm: what an existing record was written by.
  fs.writeFileSync(scriptPath, current.replace('function hashPathspecs(', 'function portableHash(') +
    '\nfunction hashPathspecs(pathspecs, extra) { return legacyHashPathspecs(pathspecs, extra); }\n');
  fs.mkdirSync(path.join(root, 'out'));
  fs.writeFileSync(path.join(root, 'render.mjs'),
    "import fs from 'node:fs'; fs.writeFileSync('rendered.marker', 'x'); fs.writeFileSync('out/tour.mp4', 'video');");
  delete item.recipe;
  delete item.source;
  Object.assign(item, { kind: 'trailer', output: 'out/tour.mp4', build: 'node render.mjs', inputs: ['app.txt'] });
  writeConfig();
  fs.writeFileSync(path.join(root, '.gitignore'), 'rendered.marker\nout/\npublic/\nproject-media/\nscripts/\nfake-encoder.mjs\nrender.mjs\n');
  commitAll(root, 'a rendered trailer');
  fs.rmSync(path.join(root, 'project-media/trailers.json'));
  const built = trailers(root);
  assert.equal(built.status, 0, built.stdout + built.stderr);
  assert.ok(fs.existsSync(path.join(root, 'rendered.marker')), 'the fixture really rendered once');
  const recordPath = path.join(root, 'project-media/trailers.json');
  const record = JSON.parse(fs.readFileSync(recordPath));
  const legacyHash = record.items[0].inputsHash;
  delete record.items[0].settingsHash;
  fs.writeFileSync(recordPath, JSON.stringify(record));

  fs.writeFileSync(scriptPath, current);
  fs.rmSync(path.join(root, 'rendered.marker'));
  const strict = check(root, false);
  assert.equal(strict.status, 0, strict.stdout + strict.stderr);
  const migrated = trailers(root);
  assert.equal(migrated.status, 0, migrated.stdout + migrated.stderr);
  assert.equal(fs.existsSync(path.join(root, 'rendered.marker')), false, 'no second render');
  const after = JSON.parse(fs.readFileSync(recordPath)).items[0];
  assert.notEqual(after.inputsHash, legacyHash, 'the record moved to the portable hash');
  assert.match(after.settingsHash, /^[a-f0-9]{64}$/);
});

test('a lenient screenshot never satisfies a strict run', async t => {
  const { PROFILES, joinUrl } = await import(pathToFileURL(library).href);
  const capture = { inputs: ['app.txt'] };
  const root = shotsFixture(t, capture);
  fs.writeFileSync(path.join(root, 'app.txt'), 'app\n');
  commitAll(root, 'app');
  const fingerprint = shots(root, '--source=local', '--fingerprint').stdout.trim();
  const target = joinUrl('http://127.0.0.1:5173/', '/');
  fs.mkdirSync(path.join(root, 'project-media'));
  const profiles = Object.entries(PROFILES).map(([name, profile]) => {
    fs.writeFileSync(path.join(root, 'project-media', name + '.jpg'), 'picture');
    return { profile: name, file: name + '.jpg', status: 'captured',
      dependencyHash: hash({ version: 1, fingerprint, source: 'local', target, capture, profile }) };
  });
  const write = () => fs.writeFileSync(path.join(root, 'project-media/capture.json'),
    JSON.stringify({ dependencySchema: 1, source: 'local', url: target, recipe: capture, profiles }));
  write();
  const clean = shots(root, '--source=local', '--check');
  assert.equal(clean.status, 0, clean.stdout + clean.stderr);
  profiles[0].lenient = true;
  write();
  const flagged = shots(root, '--source=local', '--check');
  assert.equal(flagged.status, 1, flagged.stdout + flagged.stderr);
  assert.match(flagged.stderr, new RegExp('stale profiles: ' + profiles[0].profile));
  delete profiles[0].lenient;
  profiles[1].problems = ['frame is blank'];
  write();
  assert.equal(shots(root, '--source=local', '--check').status, 1);
});

async function fingerprintServer(t, routes) {
  const { createServer } = await import('node:http');
  const { promisify } = await import('node:util');
  const { execFile } = await import('node:child_process');
  const server = createServer((request, response) => routes(request, response));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  return (root) => promisify(execFile)(process.execPath, ['scripts/capture-project-shots.mjs',
    '--url=http://127.0.0.1:' + server.address().port + '/', '--fingerprint'], { cwd: root });
}

test('deployed assets resolve against the page after a redirect', async t => {
  let bundle = 'one';
  const print = await fingerprintServer(t, (request, response) => {
    if (request.url === '/app') { response.writeHead(302, { location: '/app/' }); return response.end(); }
    if (request.url === '/app/') return response.end('<script src="./bundle.js"></script>');
    if (request.url === '/app/bundle.js') return response.end(bundle);
    response.writeHead(404);
    response.end();
  });
  const root = shotsFixture(t, { route: '/app' });
  const first = (await print(root)).stdout;
  assert.equal((await print(root)).stdout, first);
  bundle = 'two';
  assert.notEqual((await print(root)).stdout, first, 'the redirected bundle is what was hashed');
});

test('a missing asset changes the fingerprint without stopping it, a missing page still fails', async t => {
  let broken = true;
  let pageMissing = false;
  const print = await fingerprintServer(t, (request, response) => {
    if (pageMissing) { response.writeHead(500); return response.end(); }
    if (request.url === '/') return response.end('<img src="/gone.png">');
    if (broken) { response.writeHead(404); return response.end(); }
    response.end('image');
  });
  const root = shotsFixture(t, {});
  const missing = (await print(root)).stdout;
  broken = false;
  assert.notEqual((await print(root)).stdout, missing);
  pageMissing = true;
  await assert.rejects(print(root));
});

test('deployed assets resolve against the document base when the page has one', async t => {
  let bundle = 'one';
  const print = await fingerprintServer(t, (request, response) => {
    if (request.url === '/nested/page') return response.end('<base href="/"><script src="bundle.js"></script>');
    if (request.url === '/bundle.js') return response.end(bundle);
    response.writeHead(404);
    response.end();
  });
  const root = shotsFixture(t, { route: '/nested/page' });
  const first = (await print(root)).stdout;
  bundle = 'two';
  assert.notEqual((await print(root)).stdout, first, 'the bundle under the base is what was hashed');
});

test('asset references count however the HTML quotes them', async t => {
  const pages = {
    unquoted: '<script src=/bundle.js></script>',
    single: "<script src='/bundle.js'></script>",
    spaced: '<script src = "/bundle.js"></script>',
    multiline: '<link rel=preload\n  href=/bundle.js>',
    'unquoted base': '<base href=/assets/><script src=bundle.js></script>'
  };
  for (const [name, html] of Object.entries(pages)) {
    let bundle = 'one';
    const print = await fingerprintServer(t, (request, response) => {
      if (request.url === '/') return response.end(html);
      if (request.url.endsWith('/bundle.js')) return response.end(bundle);
      response.writeHead(404);
      response.end();
    });
    const root = shotsFixture(t, {});
    const first = (await print(root)).stdout;
    bundle = 'two';
    assert.notEqual((await print(root)).stdout, first, name);
  }
});

test('a data attribute is not an asset reference', async t => {
  let requests = 0;
  const print = await fingerprintServer(t, (request, response) => {
    if (request.url === '/') return response.end('<img data-src="/lazy.png" src="/real.png">');
    if (request.url === '/lazy.png') requests += 1;
    response.end('image');
  });
  await print(shotsFixture(t, {}));
  assert.equal(requests, 0);
});

test('character references in an asset URL are decoded as the browser decodes them', async t => {
  const pages = {
    '/bundle.js?v=1&lang=en': ['<script src="/bundle.js?v=1&amp;lang=en"></script>', '<script src="/bundle.js?v=1&#38;lang=en"></script>',
      '<script src="/bundle.js?v=1&#x26;lang=en"></script>'],
    '/bundle.js?a=1&lt=2': ['<script src="/bundle.js?a=1&lt=2"></script>'],
    '/bundle.js?q=&lt;': ['<script src="/bundle.js?q=&amp;lt;"></script>']
  };
  for (const [url, variants] of Object.entries(pages)) {
    for (const html of variants) {
      let bundle = 'one';
      const print = await fingerprintServer(t, (request, response) => {
        if (request.url === '/') return response.end(html);
        if (request.url === url) return response.end(bundle);
        response.writeHead(404);
        response.end();
      });
      const root = shotsFixture(t, {});
      const first = (await print(root)).stdout;
      bundle = 'two';
      assert.notEqual((await print(root)).stdout, first, html);
    }
  }
});
