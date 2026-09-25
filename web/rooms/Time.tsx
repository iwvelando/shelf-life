import { useEffect, useState } from "react";
import { duration } from "../format";
import type { TimeReport } from "../types";
import type { RoomProps } from "./shared";

export function Time({
  engine,
  ready,
  stay,
  reset,
}: RoomProps & { reset: () => void }) {
  const [report, setReport] = useState<TimeReport>();
  useEffect(() => {
    if (!ready) return;
    let live = true;
    engine.time(stay.seconds).then(
      (r) => live && setReport(r),
      () => {},
    );
    return () => {
      live = false;
    };
  }, [engine, ready, stay.seconds]);

  return (
    <section id="time" className="room" aria-labelledby="time-title">
      <h2 id="time-title">Time</h2>
      <p id="time-spent">
        You have spent {duration(stay.seconds)} here, by the Library's
        reckoning: half a minute a page, five seconds a book on the shelf, three
        days a fall.
      </p>
      {report && stay.seconds > 0 && (
        <p id="time-fraction">
          As a share of one age of the universe, that is{" "}
          <span className="figure">{report.universeFractionText}</span>. And an
          age of the universe is not a measurable share of your sentence.
        </p>
      )}
      <button type="button" className="secondary" onClick={reset}>
        Start the stay over
      </button>
      <p className="aside">
        This forgets your tally on this device. The Library does not notice.
      </p>
    </section>
  );
}
