# Instructions for contributors and coding agents

## Intent

Shelf Life is an interactive homage to Steven L. Peck's novella _A Short Stay in Hell_ (2009), itself built on Borges' _The Library of Babel_. Its one job is to make a visitor _feel_ a number the mind cannot hold: the Library's ~10^1,918,666 books. Every room lets the visitor act (read, search, find, reckon, fall) and watch the Library not notice. It began as a terminal program; the website is its successor.

It is an homage, not an adaptation. It contains no text from the novella or from Borges. Keep all prose original, keep the credit to Peck and Borges visible, and don't claim details of Peck's hell that the book doesn't give; state assumptions (gallery height, terminal velocity) as assumptions.

Read `README.md` and `docs/mathematics.md` before changing any figure the site shows.

## Discovery and tools

If codebase-memory-mcp is available, prefer `search_graph`, `trace_path`, `get_code_snippet`, `query_graph`, and `get_architecture` for code discovery. Fall back to `rg` and direct reads when graph tools are unavailable or insufficient; use `rg` for configuration and literal searches. Graph tools and local command wrappers are optional; project scripts must run without them or machine-specific paths.

## Boundaries

- The arithmetic of the incomprehensible belongs in Go (`engine/`), with no UI dependency. Anything that could overflow a float64 stays a base-10 logarithm. TypeScript owns prose, presentation, and the visitor's stay; it does not compute Library figures.
- `engine/api` is the only request/response surface; `cmd/wasm` is transport only. Keep `web/types.ts` synchronized with the Go JSON fields.
- **The Library's layout is fixed.** `engine/library` maps each location to exactly one page and back. Changing the alphabet, geometry, scramble, or the labels its constants derive from moves every page in the Library, so a visitor's found page would no longer be at the address they were given. `TestTheFirstPageNeverMoves` guards this; update it only for a deliberate, documented relayout.
- Every page shown is the real page at the location shown, including teaser pages: they are built, then located. Never display text at an address that doesn't hold it.
- The alphabet has 29 symbols (`a`–`z`, space, comma, period): Borges' three marks with the whole alphabet, not his 22 unnamed letters, so a visitor's words are found as written. Digits and other marks a visitor enters are spelled into it and the changes are shown, never silently. Teaser lines in `web/teasers.json` must be written in the alphabet already; the WASM bridge test enforces it.
- Keep computation in the browser worker. Do not introduce a server, accounts, or remote data collection. The stay persists only in the visitor's own browser storage, and storage denial must not break the site.
- Theme defaults to the live system preference. Explicit choices persist locally.
- Respect `prefers-reduced-motion`: the fall plays instantly and the shaft stops breathing.

## Verification

Run `gofmt` on changed Go files. For changes to figures, test against analytic values (and the terminal version's outputs where they overlap); a matching screenshot alone is insufficient. Extend tests for regressions, especially invalid input and round trips between pages and locations.

`make check` runs formatting checks, Go vet, native tests with race/coverage, a real WASM bridge test, TypeScript checks, and the production build. `make test-browser` runs the browser tests (desktop and a 360 px phone) after `npx playwright install chromium`; `make test-webkit` runs the iPhone-sized WebKit check after `npx playwright install webkit`. When changing layout, look at the rooms in both themes on a phone and a desktop: no page may scroll sideways, and all 80 columns of a page must fit a phone. Report the checks you actually ran and what remains unverified.

Preserve user work. Keep generated files (`public/engine.wasm`, `public/wasm_exec.js`, `web/generated/`, notices), caches, dependency directories, and build output out of version control. Commit the npm lockfile. Update generated distribution notices when adding runtime dependencies; verify all three license files are included in dist/. Merging to `main` deploys to production (`.github/workflows/ci.yml`); never deploy any other way. Dependabot patch and minor updates merge and deploy on their own once `Verify` passes (`.github/workflows/dependabot-merge.yml`), so the browser tests are what stands between a bad dependency and production. Keep `tests/smoke.spec.ts` fast and read-only, because it runs against the live site after every deploy. Any page or worker that needs a new kind of resource needs a matching change to `deploy/content-security-policy.txt`, and the same change in `iwvelando/cloud-accounts` (`sites/shelf-life.isaacvelando.com`) before this repo's change merges. Use the project's MIT license and retain dependency notices. Leave no machine-specific paths in source or docs.
