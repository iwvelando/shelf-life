import { commas } from "./format";

// The terminal version's search parties, as powers of ten.
export const efforts = [
  { name: "You, alone, one book a second", searchersLog: 0, rateLog: 0 },
  {
    name: "You, alone, ten a second, never sleeping",
    searchersLog: 0,
    rateLog: 1,
  },
  {
    name: "Everyone who has ever lived, one a second each",
    searchersLog: 11.07,
    rateLog: 0,
  },
  {
    name: "A billion searchers, a billion books a second each",
    searchersLog: 9,
    rateLog: 9,
  },
  {
    name: "One searcher per atom in the universe, a trillion a second each",
    searchersLog: 80,
    rateLog: 12,
  },
  {
    name: "Every atom, once every Planck instant",
    searchersLog: 80,
    rateLog: 43.27,
  },
];

export const spans = [
  {
    name: "A human lifetime",
    phrase: "a human lifetime",
    yearsLog: Math.log10(80),
  },
  {
    name: "Since the Big Bang",
    phrase: "the age of the universe",
    yearsLog: Math.log10(13.8e9),
  },
  { name: "A googol years", phrase: "a googol years", yearsLog: 100 },
];

// How long a search lasts, in words: "In a googol years they would check…".
export function span(yearsLog: number) {
  const known = spans.find((s) => Math.abs(s.yearsLog - yearsLog) < 0.005);
  return known ? known.phrase : `${describe(yearsLog)} years`;
}

const words: [number, string][] = [
  [100, "a googol"],
  [12, "a trillion"],
  [9, "a billion"],
  [6, "a million"],
  [3, "a thousand"],
];

// Plain words for a power of ten, where there are any.
export function describe(log: number) {
  if (log < 6) return commas(10 ** log);
  const exact = words.find(([l]) => Math.abs(l - log) < 0.005);
  if (exact) return exact[1];
  return `10^${log.toFixed(2).replace(/\.?0+$/, "")}`;
}
