// A line-for-line TypeScript port of RandomGen from the public weighted-draw-engine
// repository (random_number_generator.py): the same validation messages, duplicate
// merging, cumulative probabilities rounded to two places, and binary search over
// them. Python draws with random.random(); this draws with Math.random().
const ROUND = (x: number) => Math.round(x * 100) / 100;
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
      if (prob < 0) throw new Error(`Value Error: Probabilities cannot be negative. Found a negative value: ${prob}.`);
      merged.set(num, (merged.get(num) ?? 0) + prob);
      total += prob;
    });
    if (ROUND(total) !== 1) throw new Error(`Value Error: The sum of probabilities is ${total}, but it must be equal to 1.0.`);
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
    return this.outcomes[Math.min(low, this.outcomes.length - 1)];
  }
}
