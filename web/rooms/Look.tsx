import { useState } from "react";
import { Shaft } from "../art";
import { views } from "../prose";
import type { Constants } from "../types";

export function Look({
  constants,
  returning,
}: {
  constants: Constants;
  returning: boolean;
}) {
  const [view, setView] = useState(0);
  return (
    <header id="look" className="room arrival">
      <Shaft id="shaft" />
      <h1>You are dead.</h1>
      {returning && <p className="returning">Welcome back. You never left.</p>}
      <p>
        The being that meets you is almost apologetic. You had the wrong
        religion, it explains (nearly everyone did), but the punishment is
        gentle, as these things go. There is a way out. You need only find your
        book.
      </p>
      <p>
        Around you the Library opens: hexagonal galleries without end, shelf
        above shelf, balcony above balcony, ringing a shaft that drops past
        sight. Every book is 410 pages long. Somewhere on these shelves is the
        one that tells the true and complete story of your life. Bring it to a
        gate and you may go.
      </p>
      <p>
        Every possible such book is here: every arrangement of 80 characters a
        line, 40 lines a page, that the alphabet can spell. That is{" "}
        <span className="figure">{constants.booksText}</span> books.
      </p>
      <p className="aside">
        Take your time. You have, the being notes as it leaves, nothing else.
      </p>
      <p id="look-view" className="view" aria-live="polite">
        {views[view]}
      </p>
      <button type="button" onClick={() => setView((view + 1) % views.length)}>
        Look around
      </button>
    </header>
  );
}
