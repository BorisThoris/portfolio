// Integer Fit's rule, as its demo prints it: which built-in C# integer types can
// hold a number, in C#'s own order, and BigInteger when none can. BigInt, because
// a JavaScript number cannot hold 9223372036854775808 exactly.
export const INTEGER_TYPES = [
  { name: "sbyte", min: -128n, max: 127n },
  { name: "byte", min: 0n, max: 255n },
  { name: "short", min: -32768n, max: 32767n },
  { name: "ushort", min: 0n, max: 65535n },
  { name: "int", min: -2147483648n, max: 2147483647n },
  { name: "uint", min: 0n, max: 4294967295n },
  { name: "long", min: -9223372036854775808n, max: 9223372036854775807n },
  { name: "ulong", min: 0n, max: 18446744073709551615n },
] as const;

export type Fit =
  | { kind: "fits"; value: bigint; types: string[] }
  | { kind: "none"; value: bigint }
  | { kind: "invalid" };

export function integerFit(input: string): Fit {
  const text = input.trim();
  if (!/^[+-]?\d+$/.test(text)) return { kind: "invalid" };
  const value = BigInt(text.replace(/^\+/, ""));
  const types = INTEGER_TYPES.filter((type) => value >= type.min && value <= type.max).map((type) => type.name);
  return types.length ? { kind: "fits", value, types } : { kind: "none", value };
}
