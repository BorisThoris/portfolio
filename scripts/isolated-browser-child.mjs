// The private Windows station does not inherit stdout/stderr. Persist check output.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [script, logRelative] = process.argv.slice(2);
if (!/^scripts\/[a-z0-9-]+\.mjs$/.test(script) ||
    !/^output\/playwright\/isolated-[a-z0-9-]+-\d+\.log$/.test(logRelative)) {
  throw new Error('Expected a validated browser check and output log path');
}
const root = process.cwd();
const log = fs.openSync(path.join(root, logRelative), 'w');
for (const name of ['log', 'error', 'warn', 'info']) {
  console[name] = (...args) => fs.writeSync(log, args.map(String).join(' ')+'\n');
}
try {
  await import(pathToFileURL(path.join(root, script)).href);
} catch (error) {
  fs.writeSync(log, `${error?.stack ?? error}\n`);
  process.exitCode = 1;
} finally {
  fs.closeSync(log);
}
