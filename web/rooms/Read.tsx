import { useState } from "react";
import { Shelf } from "../art";
import { LocationView, PageView } from "../PageView";
import teasers from "../teasers.json";
import type { Page } from "../types";
import { message, type RoomProps } from "./shared";

type Reading = Page & { teaser?: { offset: number; length: number } };

export function Read({ engine, ready, add }: RoomProps) {
  const [page, setPage] = useState<Reading>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const run = async (get: () => Promise<Reading>) => {
    setBusy(true);
    setError(undefined);
    try {
      setPage(await get());
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  };

  const pull = () =>
    run(async () => {
      add({ examined: 1, seconds: 30 });
      // Now and then, a cruel flicker of sense: a page of noise with one
      // coherent line on it. It is a real page, at the address shown.
      if (Math.random() < 0.12) {
        const text = teasers[Math.floor(Math.random() * teasers.length)];
        const found = await engine.locate(text, "line");
        return {
          ...found,
          teaser: { offset: found.offset, length: found.length },
        };
      }
      return engine.page();
    });

  const turn = () =>
    page &&
    run(() => {
      add({ seconds: 30 });
      return engine.page({ ...page.location, page: page.location.page + 1 });
    });

  const last = page?.location.page === 409;
  return (
    <section id="read" className="room" aria-labelledby="read-title">
      <h2 id="read-title">The shelves</h2>
      <p>
        Four walls of every gallery hold five shelves each, and every shelf
        holds thirty-two books. None has a title. Pull one and open it anywhere.
      </p>
      <Shelf pulled={page?.location.volume} />
      <div className="actions">
        <button type="button" onClick={pull} disabled={!ready || busy}>
          Pull a book
        </button>
        {page && (
          <button
            type="button"
            className="secondary"
            onClick={turn}
            disabled={busy || last}
          >
            Turn the page
          </button>
        )}
      </div>
      {error && <p role="alert">{error}</p>}
      {page && (
        <>
          <LocationView id="read-location" location={page.location} />
          <PageView id="read-page" lines={page.lines} mark={page.teaser} />
          <p className="verdict" aria-live="polite">
            {page.teaser
              ? "For one line your heart leaps: words! Then the sense dissolves back into noise, the way it always does. The book is gibberish, like all the rest."
              : last
                ? "The last page. Gibberish, like all the rest."
                : "Gibberish, like all the rest."}
          </p>
        </>
      )}
    </section>
  );
}
