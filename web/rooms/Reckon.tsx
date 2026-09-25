import { useEffect, useRef, useState } from "react";
import { ExponentBar } from "../art";
import { commas } from "../format";
import { describe, efforts, span, spans } from "../presets";
import type { Effort, EffortReport } from "../types";
import { message, type RoomProps } from "./shared";

const sliders: {
  key: keyof Effort;
  label: string;
  min: number;
  max: number;
  unit: (log: number) => string;
}[] = [
  {
    key: "searchersLog",
    label: "Searchers",
    min: 0,
    max: 120,
    unit: (l) => (l === 0 ? "just you" : `${describe(l)} searchers`),
  },
  {
    key: "rateLog",
    label: "Books each checks per second",
    min: -2,
    max: 60,
    unit: (l) => `${describe(l)} a second`,
  },
  {
    key: "yearsLog",
    label: "Years",
    min: 0,
    max: 120,
    unit: (l) => `${describe(l)} years`,
  },
];

export function Reckon({ engine, ready, constants }: RoomProps) {
  const [effort, setEffort] = useState<Effort>({
    searchersLog: 9,
    rateLog: 9,
    yearsLog: 100,
  });
  const [report, setReport] = useState<EffortReport>();
  const [error, setError] = useState<string>();
  const latest = useRef(0);

  useEffect(() => {
    if (!ready) return;
    const ask = ++latest.current;
    engine
      .reckon(effort)
      .then((r) => {
        if (ask !== latest.current) return;
        setReport(r);
        setError(undefined);
      })
      .catch((e) => ask === latest.current && setError(message(e)));
  }, [engine, ready, effort]);

  const set = (key: keyof Effort, value: number) =>
    setEffort((e) => ({ ...e, [key]: value }));
  const active = (e: { searchersLog: number; rateLog: number }) =>
    e.searchersLog === effort.searchersLog && e.rateLog === effort.rateLog;

  return (
    <section id="reckon" className="room" aria-labelledby="reckon-title">
      <h2 id="reckon-title">The reckoning</h2>
      <p>
        Suppose you were not alone. Raise a search party, as large and as fast
        as you like, and see how long it takes to read every book. The dials
        count in powers of ten: each step multiplies the effort tenfold.
      </p>
      <div className="chips" role="group" aria-label="Search parties">
        {efforts.map((e) => (
          <button
            key={e.name}
            type="button"
            className="chip"
            aria-pressed={active(e)}
            onClick={() =>
              setEffort((x) => ({
                ...x,
                searchersLog: e.searchersLog,
                rateLog: e.rateLog,
              }))
            }
          >
            {e.name}
          </button>
        ))}
      </div>
      <div className="dials">
        {sliders.map((s) => (
          <div className="dial" key={s.key}>
            <label htmlFor={`dial-${s.key}`}>{s.label}</label>
            <input
              id={`dial-${s.key}`}
              type="range"
              min={s.min}
              max={s.max}
              step={0.01}
              value={effort[s.key]}
              onChange={(e) => set(s.key, Number(e.target.value))}
            />
            <output htmlFor={`dial-${s.key}`}>{s.unit(effort[s.key])}</output>
          </div>
        ))}
      </div>
      <div className="chips" role="group" aria-label="How long they search">
        {spans.map((s) => (
          <button
            key={s.name}
            type="button"
            className="chip"
            aria-pressed={Math.abs(s.yearsLog - effort.yearsLog) < 0.005}
            onClick={() => set("yearsLog", s.yearsLog)}
          >
            {s.name}
          </button>
        ))}
      </div>
      {error && <p role="alert">{error}</p>}
      {report && (
        <div aria-live="polite">
          <dl className="figures">
            <div>
              <dt>Seconds to read every book</dt>
              <dd id="reckon-seconds">{report.secondsText}</dd>
            </div>
            <div>
              <dt>In years</dt>
              <dd>{report.yearsText}</dd>
            </div>
            <div>
              <dt>In ages of the universe</dt>
              <dd id="reckon-ages">{report.universeAgesText}</dd>
            </div>
            <div>
              <dt>Digits the whole effort takes off that wait</dt>
              <dd id="reckon-removed">
                {commas(report.digitsRemoved)} of {commas(constants.bookDigits)}
              </dd>
            </div>
          </dl>
          <ExponentBar
            total={constants.booksLog}
            removed={report.digitsRemoved}
          />
          <p className="caption">
            Above, the wait as a bar of its digits. Below, its very end,
            magnified. The gilt sliver is everything your search party achieves.
          </p>
          <p>
            In {span(effort.yearsLog)} they would check {report.examinedText}{" "}
            books:{" "}
            <span id="reckon-fraction" className="figure">
              {report.finished ? "all of it" : `${report.fractionText} percent`}
            </span>{" "}
            of the Library.
            {!report.finished &&
              " Books still unread: essentially all of them."}
          </p>
        </div>
      )}
      <p id="library-cube">
        Packed into a cube, the Library would be{" "}
        <span className="figure">{constants.cubeSideHexagonsText}</span>{" "}
        galleries on a side. At three metres a gallery, that is{" "}
        <span className="figure">{constants.cubeSideUniversesText}</span> times
        the width of the observable universe.
      </p>
      <p className="aside">
        This is why they keep searching anyway. There is nothing else to do, and
        forever is long enough that even this is, in the end, only the
        beginning.
      </p>
    </section>
  );
}
