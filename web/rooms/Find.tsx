import { useState, type FormEvent } from "react";
import { commas } from "../format";
import { LocationView, PageView } from "../PageView";
import type { Found, Mode } from "../types";
import { message, type RoomProps } from "./shared";

export function Find({ engine, ready }: RoomProps) {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>("noise");
  const [found, setFound] = useState<Found & { asked: string }>();
  const [error, setError] = useState<string>();
  const [check, setCheck] = useState<string>();
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setCheck(undefined);
    try {
      setFound({ ...(await engine.locate(text, mode)), asked: text });
      setError(undefined);
    } catch (err) {
      setFound(undefined);
      setError(message(err));
    } finally {
      setBusy(false);
    }
  };

  // Ask the Library for the page at the address, and compare.
  const lookUp = async () => {
    if (!found) return;
    try {
      const page = await engine.page(found.location);
      setCheck(
        page.lines.join("\n") === found.lines.join("\n")
          ? "The page at this address is the same page, character for character."
          : "The page at this address is different. That should not happen.",
      );
    } catch (err) {
      setCheck(message(err));
    }
  };

  const changes = found?.spelling.changes ?? [];
  return (
    <section id="find" className="room" aria-labelledby="find-title">
      <h2 id="find-title">Your page</h2>
      <p>
        Every page that can be written is on a shelf somewhere, so yours is too.
        Write a name, a sentence, anything up to a page long, and the Library
        will tell you exactly where it is.
      </p>
      <form onSubmit={submit} className="find-form">
        <label htmlFor="find-text">Text to find</label>
        <textarea
          id="find-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          maxLength={6400}
          placeholder="Your name, or the first line of your life"
        />
        <fieldset>
          <legend>Put it on a page</legend>
          <label>
            <input
              type="radio"
              name="mode"
              checked={mode === "noise"}
              onChange={() => setMode("noise")}
            />
            Amid noise
          </label>
          <label>
            <input
              type="radio"
              name="mode"
              checked={mode === "blank"}
              onChange={() => setMode("blank")}
            />
            On a blank page
          </label>
        </fieldset>
        <button type="submit" disabled={!ready || busy}>
          Find it
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
      {found && (
        <div className="found" aria-live="polite">
          <p id="find-spelling">{spellingNote(found.spelling.text, changes)}</p>
          <LocationView id="find-location" location={found.location} />
          <PageView id="find-page" lines={found.lines} mark={found} />
          <p>
            The hexagon number alone is{" "}
            <span className="figure">
              {commas(found.location.hexagon.length)}
            </span>{" "}
            digits long. Your text is {commas(found.length)}{" "}
            {found.length === 1 ? "character" : "characters"}; the whole page is
            3,200. The directions to your page are longer than the page. Knowing
            where it is was never the problem.
          </p>
          <div className="actions">
            <button type="button" className="secondary" onClick={lookUp}>
              Look it up
            </button>
          </div>
          {check && <p id="find-check">{check}</p>}
        </div>
      )}
    </section>
  );
}

function spellingNote(text: string, changes: { from: string; to: string }[]) {
  if (changes.length === 0)
    return `Spelled exactly as you wrote it: “${text}”.`;
  const letters = changes.filter((c) => /\p{L}/u.test(c.from) && c.to !== "");
  const lacks = letters.length
    ? `The Library has no ${letters.map((c) => c.from).join(", ")}.`
    : "The Library can't write every mark you used.";
  return `${lacks} It writes your text as “${text}”.`;
}
