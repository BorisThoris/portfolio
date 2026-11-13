import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
// Differential check: the TypeScript RandomGen port against the real Python class.
// Usage: git clone https://github.com/BorisThoris/weighted-draw-engine <dir>
//        node scripts/weighted-draw-parity.mjs <dir>
import path from "node:path";
import os from "node:os";
const repo = process.argv[2];
if (!repo) throw new Error("Pass the path of a weighted-draw-engine checkout");
const here = path.dirname(fileURLToPath(import.meta.url));
const pyScript = path.join(here, "weighted-draw-parity.py");
const ts = path.join(here, "..", "src", "ui", "project", "toys", "weightedDraw.ts");
const { RandomGen } = await import(pathToFileURL(ts).href);
const draws = [0.005, 0.01, 0.0100001, 0.125, 0.3, 0.31, 0.315, 0.5, 0.875, 0.88, 0.885, 0.89, 0.995, 0.999];
const cases = [[[-1,0,1,2,3],[0.01,0.3,0.58,0.1,0.01]], [[1,2],[0.5,0.495]], [[1,2],[0.5,0.505]], [[1,2],[0.995,0]], [[1,2],[0.125,0.875]], [[1,2,3],[0.125,0.125,0.75]], [[1,1,2],[0.25,0.25,0.5]], [[1,2],[0.5,0.47]], [[1],[-0.5]], [[], []], [[1,2],[1]], [[1e10],[1]], [[1.5],[1]]];
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
for (let i = 0; i < 3000; i++) {
  const n = 1 + Math.floor(rnd() * 5);
  const nums = Array.from({ length: n }, () => Math.floor(rnd() * 7) - 3);
  const probs = Array.from({ length: n }, () => Math.round(rnd() * 80) / 200);
  const sum = probs.reduce((a, b) => a + b, 0);
  if (rnd() < 0.7) probs[n - 1] = Math.max(0, Math.round((probs[n - 1] + 1 - sum) * 200 + (rnd() < 0.5 ? 0 : (rnd() < 0.5 ? 1 : -1))) / 200);
  cases.push([nums, probs]);
}
const file = path.join(os.tmpdir(), "weighted-draw-parity-cases.json"); writeFileSync(file, JSON.stringify(cases));
const py = JSON.parse(execFileSync("python", ["-I", pyScript, repo, file], { maxBuffer: 1 << 28 }).toString());
let bad = 0, accepted = 0;
cases.forEach(([nums, probs], i) => {
  let mine;
  try { const g = new RandomGen(nums, probs, (() => { let k = 0; return () => draws[k++]; })()); mine = { ok: draws.map(() => { try { return g.nextNum(); } catch (e) { return e.message.split(":")[0]; } }) }; }
  catch (e) { mine = { err: e.message }; }
  const want = py[i]; const wantView = want.err !== undefined ? { err: want.err } : { ok: want.ok };
  if (JSON.stringify(mine) !== JSON.stringify(wantView)) { if (bad++ < 6) console.log("DIFF", JSON.stringify([nums, probs]), "\n  py ", JSON.stringify(wantView), "\n  ts ", JSON.stringify(mine)); }
  if (want.ok) accepted++;
});
console.log(`${cases.length} cases, ${accepted} accepted by Python, ${bad} differences`);
process.exitCode = bad ? 1 : 0;
