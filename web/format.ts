export const commas = (n: number) =>
  Math.round(n).toLocaleString("en-US", { maximumFractionDigits: 0 });

const units: [string, number][] = [
  ["year", 31_557_600],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
  ["second", 1],
];

const plural = (n: number, unit: string) =>
  `${commas(n)} ${unit}${n === 1 ? "" : "s"}`;

// "3 days, 4 hours": the largest unit, and the next one down if it isn't zero.
export function duration(seconds: number) {
  const s = Math.floor(seconds);
  if (s < 1) return "no time at all";
  const i = units.findIndex(([, size]) => s >= size);
  const [unit, size] = units[i];
  const whole = Math.floor(s / size);
  const out = plural(whole, unit);
  if (i + 1 === units.length) return out;
  const [nextUnit, nextSize] = units[i + 1];
  const rest = Math.floor((s - whole * size) / nextSize);
  return rest ? `${out}, ${plural(rest, nextUnit)}` : out;
}

// A power of ten written the way the engine writes large exponents: 10^1,834,097.
export const power = (log: number) => `10^${commas(Math.floor(log))}`;
