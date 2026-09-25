import { useEffect, useRef, useState } from "react";
import { Tally, Tunnel } from "../art";
import { fall, fallMillis } from "../prose";
import type { FallReport } from "../types";
import { message, type RoomProps } from "./shared";

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export function Fall({ engine, ready, stay, add }: RoomProps) {
  const [shown, setShown] = useState(0); // lines of the fall shown so far
  const [falling, setFalling] = useState(false);
  const [report, setReport] = useState<FallReport>();
  const [error, setError] = useState<string>();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const land = async () => {
    setFalling(false);
    setShown(fall.length);
    const { deaths } = add({ deaths: 1, seconds: 3 * 86_400 });
    try {
      setReport(await engine.fall(deaths));
      setError(undefined);
    } catch (e) {
      setError(message(e));
    }
  };

  const letGo = () => {
    setReport(undefined);
    if (reduced()) {
      void land();
      return;
    }
    setFalling(true);
    setShown(0);
    timers.current = [
      ...fall.map(([at], i) => setTimeout(() => setShown(i + 1), at)),
      setTimeout(land, fallMillis),
    ];
  };

  return (
    <section id="fall" className="room" aria-labelledby="fall-title">
      <h2 id="fall-title">The shaft</h2>
      <p>
        The rail is waist-high. Nothing stops you climbing it. Nothing here can
        stop you dying, either, or keep you dead.
      </p>
      <Tunnel falling={falling} />
      <button type="button" onClick={letGo} disabled={!ready || falling}>
        Let go
      </button>
      {shown > 0 && (
        <div className="fall-lines" aria-live="polite">
          {fall.slice(0, shown).map(([, line]) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      )}
      {error && <p role="alert">{error}</p>}
      {report && !falling && (
        <p id="fall-result">
          You have died {stay.deaths.toLocaleString("en-US")}{" "}
          {stay.deaths === 1 ? "time" : "times"}. In all you have fallen{" "}
          <span className="figure">{report.kilometresText}</span> km, past{" "}
          <span className="figure">{report.galleriesText}</span> galleries. That
          is <span className="figure">{report.fractionText}</span> percent of
          the way down, if the Library were packed into a cube. The shaft did
          not get shorter.
        </p>
      )}
      {stay.deaths > 0 && (
        <figure className="tally-figure">
          <Tally count={stay.deaths} />
          <figcaption>Your falls, scratched into the rail.</figcaption>
        </figure>
      )}
    </section>
  );
}
