import { useEffect, useRef, useState } from "react";
import { NeverBar } from "../art";
import { commas, power } from "../format";
import type { SearchReport } from "../types";
import { message, type RoomProps } from "./shared";

const lenses = ["a million times", "a googol times", "10^1,000,000 times"];

// The bar in NeverBar is 580 units wide; a unit is about a pixel on a phone.
const BAR_LOG = Math.log10(580);

export function Search({ engine, ready, constants, stay, add }: RoomProps) {
  const [report, setReport] = useState<SearchReport>();
  const [error, setError] = useState<string>();
  const [batch, setBatch] = useState<number>();
  const latest = useRef(0);
  const hold = useRef<ReturnType<typeof setTimeout>>(undefined);

  const check = async () => {
    const n = 1000 + Math.floor(Math.random() * 9000);
    setBatch(n);
    const { examined } = add({ examined: n, seconds: n * 5 });
    const ask = ++latest.current;
    try {
      const r = await engine.search(examined);
      if (ask === latest.current) setReport(r);
      setError(undefined);
    } catch (e) {
      setError(message(e));
    }
  };

  // Holding the button keeps checking, a shelf at a time.
  const startHold = () => {
    stopHold();
    hold.current = setTimeout(function again() {
      void check();
      hold.current = setTimeout(again, 120);
    }, 450);
  };
  const stopHold = () => clearTimeout(hold.current);
  useEffect(() => stopHold, []);

  const examined = Math.max(stay.examined, 1);
  const pixelLog = constants.booksLog - Math.log10(examined) - BAR_LOG;
  return (
    <section id="search" className="room" aria-labelledby="search-title">
      <h2 id="search-title">The search</h2>
      <p>
        Shelf-walk, pull, skim, reject. Check a shelf at a time, or hold the
        button down and keep going. Your tally climbs. Watch the other number.
      </p>
      <button
        type="button"
        onClick={check}
        onPointerDown={startHold}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
        onContextMenu={(e) => e.preventDefault()}
        disabled={!ready}
      >
        Check a shelf
      </button>
      {error && <p role="alert">{error}</p>}
      <dl className="figures" aria-live="polite">
        <div>
          <dt>Books you have checked</dt>
          <dd id="search-tally">
            {commas(stay.examined)}
            {batch !== undefined && (
              <span className="delta"> (+{commas(batch)})</span>
            )}
          </dd>
        </div>
        <div>
          <dt>Share of the Library you have seen</dt>
          <dd id="search-fraction">
            {report ? `${report.fractionText} percent` : "none of it"}
          </dd>
        </div>
      </dl>
      <NeverBar lenses={lenses} />
      <ol className="lens-captions" aria-hidden="true">
        {lenses.map((l) => (
          <li key={l}>Magnified {l}</li>
        ))}
      </ol>
      <p>
        To make your share of that bar one pixel wide, you would have to magnify
        it about <span className="figure">{power(pixelLog)}</span> times. The
        number you have checked grew. The share did not move. It cannot.
      </p>
    </section>
  );
}
