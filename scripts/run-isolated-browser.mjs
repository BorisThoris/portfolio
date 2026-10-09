// Run a portfolio browser check on the PC's private noninteractive station.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = process.argv[2];
if (!script || !/^scripts\/[a-z0-9-]+\.mjs$/.test(script)) {
  throw new Error('Expected a portfolio browser script path, for example scripts/check-media.mjs');
}
if (process.platform !== 'win32') {
  const result = spawnSync(process.execPath, [script], { cwd: root, stdio: 'inherit' });
  process.exit(result.status ?? 1);
}
const launcher = String.raw`D:\gha-runners\headless-tools\Start-IsolatedProcess.ps1`;
const logDirectory = path.join(root, 'output', 'playwright');
fs.mkdirSync(logDirectory, { recursive: true });
const logFile = `output/playwright/isolated-${path.basename(script, '.mjs')}-${process.pid}.log`;
const result = spawnSync('powershell.exe', ['-NoProfile', '-WindowStyle', 'Hidden',
  '-ExecutionPolicy', 'Bypass', '-File', launcher, '-FilePath', process.execPath,
  '-ArgumentString', `scripts/isolated-browser-child.mjs ${script} ${logFile}`, '-WorkingDirectory', root],
{ cwd: root, encoding: 'utf8', windowsHide: true, timeout: 20 * 60 * 1000 });
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (fs.existsSync(path.join(root, logFile))) process.stdout.write(fs.readFileSync(path.join(root, logFile), 'utf8'));
if (result.error) throw result.error;
process.exit(result.status ?? 1);
