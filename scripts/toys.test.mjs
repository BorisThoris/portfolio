// The project-page toys port real programs; hold them to those programs' own output.
import { test } from "node:test";
import assert from "node:assert/strict";
import { integerFit } from "../src/ui/project/toys/integerFit.ts";
import { RandomGen } from "../src/ui/project/toys/weightedDraw.ts";

test("Integer Fit matches every row of the IntegerFit demo transcript", () => {
  const rows = {
    "-129": "short, int, long",
    "127": "sbyte, byte, short, ushort, int, uint, long, ulong",
    "255": "byte, short, ushort, int, uint, long, ulong",
    "65536": "int, uint, long, ulong",
    "2147483648": "uint, long, ulong",
    "9223372036854775808": "ulong",
  };
  for (const [input, types] of Object.entries(rows)) {
    const fit = integerFit(input);
    assert.equal(fit.kind, "fits", input);
    assert.equal(fit.types.join(", "), types, input);
  }
  assert.equal(integerFit("18446744073709551616").kind, "none");
  assert.equal(integerFit("1.5").kind, "invalid");
  assert.equal(integerFit(" +42 ").kind, "fits");
});

test("RandomGen keeps the engine's validation, merging and proportions", () => {
  assert.throws(() => new RandomGen([1, 2], [0.5, 0.47]), { message: "Value Error: The sum of probabilities is 0.97, but it must be equal to 1.0." });
  assert.throws(() => new RandomGen([], []), { message: "Input Error: Both numbers and probabilities cannot be empty." });
  assert.throws(() => new RandomGen([1], [-0.5]), /Probabilities cannot be negative/);
  const merged = new RandomGen([1, 1, 2], [0.25, 0.25, 0.5]);
  assert.deepEqual([merged.outcomes, merged.weights], [[1, 2], [0.5, 0.5]]);
  // A fixed sequence of draws lands exactly on the cumulative boundaries 0.01 / 0.31 / 0.89 / 0.99.
  const draws = [0.005, 0.01, 0.2, 0.31, 0.5, 0.89, 0.95, 0.99, 0.995];
  let i = 0;
  const gen = new RandomGen([-1, 0, 1, 2, 3], [0.01, 0.3, 0.58, 0.1, 0.01], () => draws[i++]);
  assert.deepEqual(draws.map(() => gen.nextNum()), [-1, -1, 0, 0, 1, 1, 2, 2, 3]);
  const big = new RandomGen([-1, 0, 1, 2, 3], [0.01, 0.3, 0.58, 0.1, 0.01]);
  const counts = new Map();
  for (let n = 0; n < 100000; n++) { const v = big.nextNum(); counts.set(v, (counts.get(v) ?? 0) + 1); }
  assert.ok(Math.abs(counts.get(1) / 100000 - 0.58) < 0.01, "1 comes up about 58% of the time");
});
