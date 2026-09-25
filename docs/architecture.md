# Architecture

`Go engine (engine/) → engine/api JSON → cmd/wasm → Web Worker → React rooms + SVG`

`engine/scale`, `engine/library`, and `engine/stay` are pure Go, with no browser, filesystem, or network dependency. `engine/api` is the single request/response surface. It takes a JSON request with an `action` (`constants`, `page`, `locate`, `reckon`, `search`, `fall`, `time`) and returns JSON or `{"error": …}`, and it is tested natively. `cmd/wasm` exposes it as one global, `shelfLife(json)`, passing `crypto/rand` for randomness. `web/types.ts` mirrors the Go JSON fields.

A classic Web Worker (`web/engine.worker.ts`) loads Go's `wasm_exec.js` and `engine.wasm` on the first request. `web/engine-client.ts` numbers requests and settles each promise from the matching response. The page marks `<html data-engine="ready">` once the engine answers, and actions stay disabled until then. So the arrival can state the Library's size before the ~5 MB engine arrives, the build runs `cmd/constants` natively and bundles the result (`web/generated/constants.json`); the WASM bridge test checks the engine agrees.

Rooms (`web/rooms/`) own their own requests. Rooms that re-ask as a visitor drags a dial (Reckon) or holds a button (Search) discard stale responses by request number. The visitor's stay (`web/useStay.ts`) is books checked, deaths, and subjective seconds. It is saved to `localStorage` under `shelf-life.stay` and falls back to memory when storage is denied. The theme preference is stored under `shelf-life.theme` with the same fallback.

Drawings (`web/art.tsx`) are inline SVG coloured by CSS custom properties, so both themes apply. The shaft is one ring generator: a gallery at unit size (floor, rail, book tops) scaled by 0.8 per level. The hero draws it still and breathing; the Fall animates the same rings outward with `requestAnimationFrame`, accelerating to a blur. Reduced motion stops both, and the fall's text then appears at once. Pages render 80 columns in the system monospace face, sized with container query units so a page fits a phone without horizontal scrolling.

On wide screens a sticky rail holds the brand, the stay, and the room links; below 52rem it becomes a top bar plus a dock fixed to the bottom of the screen. The site is static, with relative asset paths, and is served under the Content-Security-Policy in `deploy/content-security-policy.txt`. It needs `'wasm-unsafe-eval'` for the engine, and nothing from any other origin.
