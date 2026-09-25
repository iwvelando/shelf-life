# Shelf Life

<img src="public/shelf-life.svg" alt="Hexagonal galleries receding down a shaft" width="96" height="96" />

A short stay in the Library of every possible book: **https://shelf-life.isaacvelando.com**

An interactive homage to Steven L. Peck's novella **_A Short Stay in Hell_ (2009)**. In it, a man dies and wakes in a hell modeled on Jorge Luis Borges' _Library of Babel_: endless hexagonal galleries holding every possible 410-page book. To leave, he must find the one book that tells the true story of his life. The horror is not fire. It is **scale**.

This site tries to make you feel that scale by letting you try, and fail. It is an homage built for that feeling: it contains no text from the novella, and all prose here is original. Please go read the book. It is short, and devastating.

## The rooms

- **Look**: the arrival, and the size of the place: 10^1,918,666 books.
- **Read**: pull a book and read a real page. Every page has an exact location, and turning the page takes you to the next one in the same book. Now and then a line almost makes sense.
- **Search**: check shelves for your book. Your tally climbs; the share of the Library you have seen stays at a decimal point followed by 1.8 million zeros.
- **Find**: type your name, or anything, and get the exact hexagon, wall, shelf, volume, and page where it is written. The address is a 4,675-digit number: the directions are longer than the page.
- **Reckon**: raise a search party, as large and fast as you like, up to every atom checking a book every Planck instant, and watch the 1.8-million-digit wait lose about 123 digits.
- **Fall**: climb the rail and let go. You fall for three days, and are remade, and are standing at a rail just like the last one.

Your stay (books checked, deaths, time) is kept in your own browser and nowhere else.

See the **[usage guide](docs/usage.md)** for details.

## How it works

The Library's arithmetic is written in Go and compiled to WebAssembly, running in a browser Web Worker. Numbers too large for any machine type are kept as base-10 logarithms. Pages and locations are two spellings of the same number: an invertible scramble modulo 29^3200 means every page has one address, and any page can be found. React and TypeScript provide the rooms, and hand-drawn SVG provides the galleries. The result is a static website, with no server, account, telemetry, or remote computation.

- [The mathematics](docs/mathematics.md): the size of the Library, the page ↔ location mapping, and every stated assumption.
- [Architecture](docs/architecture.md)

## Run locally

Requires **Go 1.26+**, **Node 22.12+**, npm, and Make.

```sh
make install
make dev
```

Then open the URL Vite prints. Other targets:

```sh
make check          # formatting, vet, Go tests, WASM bridge test, typecheck, production build
make test-browser   # Playwright, desktop and phone (npx playwright install chromium first)
make test-webkit    # Playwright on WebKit at iPhone size (npx playwright install webkit first)
make preview        # serve the production build, under the production CSP
```

## Hosting

`dist/` is a static site. Merging to `main` builds, tests, and deploys it to S3 and CloudFront, whose infrastructure lives in `iwvelando/cloud-accounts` (`sites/shelf-life.isaacvelando.com`). A smoke test then runs against the live site. The host must send:

- **Content-Security-Policy:** the value in [`deploy/content-security-policy.txt`](deploy/content-security-policy.txt). `make preview` sends it too, so the browser tests run under it.
- **Content type:** `engine.wasm` as `application/wasm`.

## Project map

| Location          | Responsibility                                         |
| ----------------- | ------------------------------------------------------ |
| `engine/scale/`   | Log-10 arithmetic and formatting of huge numbers       |
| `engine/library/` | Alphabet, spelling, and the page ↔ location mapping    |
| `engine/stay/`    | The figures each room shows                            |
| `engine/api/`     | The JSON request/response surface                      |
| `cmd/wasm/`       | Go/JavaScript transport                                |
| `cmd/constants/`  | Build-time Library constants for the first paint       |
| `web/`            | Rooms, SVG drawings, worker client, the visitor's stay |
| `tests/`          | Browser integration tests                              |
| `scripts/`        | WASM build, notices, and distribution checks           |

## License

MIT licensed, copyright Shelf Life contributors; see [LICENSE](LICENSE). Third-party components retain their own licenses. Production builds include `LICENSE.txt`, `GO-LICENSE.txt`, and `THIRD-PARTY-NOTICES.txt`.
