import { useState } from "react";
import type { Location } from "./types";
import { commas } from "./format";

// A page, 40 lines of 80 characters, sized so every column fits the screen.
// `mark` highlights a stretch of the page by its offset in the joined text.
export function PageView({
  id,
  lines,
  mark,
}: {
  id: string;
  lines: string[];
  mark?: { offset: number; length: number };
}) {
  return (
    <figure id={id} className="page">
      <div className="page-text">
        {lines.map((line, i) => {
          const start = i * 80;
          if (!mark)
            return (
              <span key={i} className="page-line">
                {line}
              </span>
            );
          const a = Math.max(0, Math.min(80, mark.offset - start));
          const b = Math.max(
            0,
            Math.min(80, mark.offset + mark.length - start),
          );
          return (
            <span key={i} className="page-line">
              {line.slice(0, a)}
              {b > a && <mark>{line.slice(a, b)}</mark>}
              {line.slice(b)}
            </span>
          );
        })}
      </div>
    </figure>
  );
}

// Where a page is shelved. Numbers are shown one-based, as a visitor counts.
export function LocationView({
  id,
  location,
}: {
  id: string;
  location: Location;
}) {
  const [open, setOpen] = useState(false);
  const digits = location.hexagon.length;
  return (
    <dl id={id} className="location">
      <div className="location-hexagon">
        <dt>Hexagon</dt>
        <dd>
          <span className={`hexagon${open ? " is-open" : ""}`}>
            {location.hexagon}
          </span>
          <button
            type="button"
            className="quiet"
            onClick={() => setOpen(!open)}
          >
            {open
              ? "Fold the digits away"
              : `Show all ${commas(digits)} digits`}
          </button>
        </dd>
      </div>
      <div>
        <dt>Wall</dt>
        <dd>{location.wall + 1}</dd>
      </div>
      <div>
        <dt>Shelf</dt>
        <dd>{location.shelf + 1}</dd>
      </div>
      <div>
        <dt>Volume</dt>
        <dd>{location.volume + 1}</dd>
      </div>
      <div>
        <dt>Page</dt>
        <dd className="page-number">{location.page + 1}</dd>
      </div>
    </dl>
  );
}
