import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Glyph } from "./art";
import { Engine } from "./engine-client";
import { commas, duration } from "./format";
import constants from "./generated/constants.json";
import { Fall } from "./rooms/Fall";
import { Find } from "./rooms/Find";
import { Look } from "./rooms/Look";
import { Read } from "./rooms/Read";
import { Reckon } from "./rooms/Reckon";
import { Search } from "./rooms/Search";
import { message } from "./rooms/shared";
import { Time } from "./rooms/Time";
import { useStay } from "./useStay";
import { useTheme } from "./useTheme";
import "./style.css";

const rooms = [
  ["look", "Look"],
  ["read", "Read"],
  ["search", "Search"],
  ["find", "Find"],
  ["reckon", "Reckon"],
  ["fall", "Fall"],
] as const;

function App() {
  const engine = useMemo(() => new Engine(), []);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState<string>();
  const theme = useTheme();
  const { stay, add, reset } = useStay();

  useEffect(() => {
    engine.constants().then(
      () => {
        setReady(true);
        document.documentElement.dataset.engine = "ready";
      },
      (e) => setFailed(message(e)),
    );
  }, [engine]);

  const props = { engine, ready, constants, stay, add };
  return (
    <div className="app">
      <aside className="rail">
        <div className="masthead">
          <a className="brand" href="#look">
            <img src="./shelf-life.svg" alt="" width={28} height={28} />
            Shelf Life
          </a>
          <button
            type="button"
            className="theme-toggle quiet"
            onClick={theme.toggle}
            aria-label={
              theme.dark ? "Switch to light theme" : "Switch to dark theme"
            }
          >
            {theme.dark ? "Light" : "Dark"}
          </button>
        </div>
        <div className="dock">
          <a className="hud" href="#time" aria-label="Your stay so far">
            <span>
              <span className="hud-label">Books </span>
              <span id="hud-examined">{commas(stay.examined)}</span>
            </span>
            <span>
              <span className="hud-label">Deaths </span>
              <span id="hud-deaths">{stay.deaths}</span>
            </span>
            <span>
              <span className="hud-label">Here </span>
              <span id="hud-time">{duration(stay.seconds)}</span>
            </span>
          </a>
          <nav aria-label="Rooms">
            {rooms.map(([id, name]) => (
              <a key={id} href={`#${id}`}>
                <Glyph name={id} />
                <span>{name}</span>
              </a>
            ))}
          </nav>
        </div>
      </aside>
      <main>
        {failed && (
          <p className="failure" role="alert">
            {failed}
          </p>
        )}
        {!ready && !failed && (
          <p className="loading">The shelves are still being stocked…</p>
        )}
        <Look constants={constants} returning={stay.returning} />
        <Read {...props} />
        <Search {...props} />
        <Find {...props} />
        <Reckon {...props} />
        <Fall {...props} />
        <Time {...props} reset={reset} />
        <footer>
          <p>
            An homage to <cite>A Short Stay in Hell</cite> (2009) by Steven L.
            Peck, itself built on Jorge Luis Borges’{" "}
            <cite>The Library of Babel</cite>. It contains no text from either;
            all prose here is original. Go read the novella. It is short, and
            devastating.
          </p>
          <p>
            <a href="https://github.com/iwvelando/shelf-life">Source</a>
            <a href="./LICENSE.txt">License</a>
            <a href="./THIRD-PARTY-NOTICES.txt">Third-party notices</a>
          </p>
        </footer>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
