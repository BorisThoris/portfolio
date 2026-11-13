// A line-for-line TypeScript port of RandomGen from the public weighted-draw-engine
// repository (random_number_generator.py): the same validation messages, duplicate
// merging, cumulative probabilities rounded to two places, and binary search over
// them, checked case by case against the Python class. Python draws with
// random.random(); this draws with Math.random().
// Python's round(x, 2): round the double's exact decimal value, ties to even.
// Math.round(x * 100) / 100 is not the same: it turns 0.995 (really 0.99499…) into 1.
export function round2(x: number): number {
  const exact = Math.abs(x).toFixed(100); // the double's exact decimal expansion
  const [whole, fraction] = exact.split(".");
  const kept = BigInt(whole + fraction.slice(0, 2));
  const rest = fraction.slice(2).replace(/0+$/, "");
  const up = rest.length > 0 && (rest[0] > "5" || (rest[0] === "5" && (rest.length > 1 || kept % 2n === 1n)));
  const value = Number(up ? kept + 1n : kept) / 100;
  return x < 0 ? -value : value;
}
const ROUND = round2;

// Python's repr() of a float, which the engine's messages print: 0.0, not 0; 1e-07, not 1e-7.
export function pyFloat(x: number): string {
  if (Number.isInteger(x) && Math.abs(x) < 1e16) return x.toFixed(1);
  return String(x).replace(/e([+-])(\d)$/, (_, sign: string, digit: string) => `e${sign}0${digit}`);
}
const MAX_INT = 10 ** 9;
const MAX_LEN = 1000;

export class RandomGen {
  readonly outcomes: number[];
  readonly weights: number[];
  private readonly cumulative: number[];
  private readonly random: () => number;

  constructor(numbers: number[], probabilities: number[], random: () => number = Math.random) {
    this.random = random;
    if (!numbers.length || !probabilities.length) throw new Error("Input Error: Both numbers and probabilities cannot be empty.");
    if (numbers.length !== probabilities.length) {
      throw new Error(`Input Error: The numbers list has ${numbers.length} elements while the probabilities list has ${probabilities.length} elements. They should match.`);
    }
    if (numbers.length > MAX_LEN) throw new Error(`Input Error: The length of the list exceeds the maximum allowed length of ${MAX_LEN}.`);
    const merged = new Map<number, number>();
    let total = 0;
    numbers.forEach((num, index) => {
      const prob = probabilities[index];
      if (!Number.isInteger(num)) throw new Error(`Type Error: Expected an integer in the numbers list but found ${num} of type float.`);
      if (Math.abs(num) > MAX_INT) throw new Error(`Value Error: Number ${num} in the list exceeds the maximum allowed value of ${MAX_INT}.`);
      if (prob < 0) throw new Error(`Value Error: Probabilities cannot be negative. Found a negative value: ${pyFloat(prob)}.`);
      merged.set(num, (merged.get(num) ?? 0) + prob);
      total += prob;
    });
    if (ROUND(total) !== 1) throw new Error(`Value Error: The sum of probabilities is ${pyFloat(total)}, but it must be equal to 1.0.`);
    this.outcomes = [...merged.keys()];
    this.weights = [...merged.values()];
    let sum = 0;
    this.cumulative = this.weights.map((weight) => ROUND((sum += weight)));
  }

  nextNum(): number {
    const target = this.random();
    let low = 0;
    let high = this.cumulative.length - 1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (this.cumulative[mid] === target) return this.outcomes[mid];
      if (this.cumulative[mid] < target) low = mid + 1;
      else high = mid - 1;
    }
    // The engine returns self._numbers[low] unchecked. When merged duplicates leave the
    // last cumulative value below the draw (0.99, say), low runs off the end and Python
    // raises IndexError. Faithful to that, not quietly patched.
    if (low >= this.outcomes.length) throw new RangeError("IndexError: list index out of range");
    return this.outcomes[low];
  }
}
