import { useCallback, useRef, useState } from "react";

// A visitor's stay: what they have checked, how often they have fallen, and how
// much subjective time that took. It persists locally, so a returning visitor
// finds the tally where they left it. Storage can be denied; the stay then lasts
// only as long as the page.
export type Stay = {
  examined: number;
  deaths: number;
  seconds: number;
  returning: boolean;
};

const key = "shelf-life.stay";
const empty: Stay = { examined: 0, deaths: 0, seconds: 0, returning: false };

function load(): Stay {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const v = JSON.parse(saved);
      const n = (x: unknown) =>
        typeof x === "number" && Number.isFinite(x) && x >= 0 ? x : 0;
      return {
        examined: n(v.examined),
        deaths: Math.floor(n(v.deaths)),
        seconds: n(v.seconds),
        returning: true,
      };
    }
    save(empty);
  } catch {
    /* Storage can be disabled; keep the stay in memory. */
  }
  return empty;
}

function save({ examined, deaths, seconds }: Stay) {
  try {
    localStorage.setItem(key, JSON.stringify({ examined, deaths, seconds }));
  } catch {
    /* Storage can be disabled; keep the stay in memory. */
  }
}

export function useStay() {
  const [stay, setStay] = useState(load);
  // Held-down buttons add many times between renders; the ref is always current.
  const current = useRef(stay);
  const add = useCallback(
    (more: Partial<Pick<Stay, "examined" | "deaths" | "seconds">>) => {
      const s = current.current;
      const next = {
        ...s,
        examined: s.examined + (more.examined ?? 0),
        deaths: s.deaths + (more.deaths ?? 0),
        seconds: s.seconds + (more.seconds ?? 0),
      };
      current.current = next;
      setStay(next);
      save(next);
      return next;
    },
    [],
  );
  const reset = useCallback(() => {
    current.current = empty;
    setStay(empty);
    save(empty);
  }, []);
  return { stay, add, reset };
}
