import { test, expect } from "@playwright/test";
import { arrive, problems } from "./helpers";

// Post-deploy smoke test. CI also runs it against the preview build; the deploy
// runs it against the live site with BASE_URL=https://shelf-life.isaacvelando.com.
// Keep it fast and read-only.
test("@smoke the Library opens and a book can be read", async ({ page }) => {
  const found = problems(page);
  const wasm = page.waitForResponse((r) => r.url().endsWith("/engine.wasm"));
  await arrive(page);
  const engine = (await wasm).headers();
  expect(engine["content-type"]).toBe("application/wasm");
  // CloudFront compresses engine.wasm to about a quarter of its size, choosing
  // Brotli or gzip per browser. If a distribution setting or the object's content
  // type changes, it would silently ship uncompressed; vite preview never
  // compresses, so this only applies to a deployed site.
  if (process.env.BASE_URL)
    expect(["br", "gzip"]).toContain(engine["content-encoding"]);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "You are dead.",
  );
  await page.getByRole("button", { name: "Pull a book" }).click();
  await expect(page.locator("#read-page .page-line")).toHaveCount(40);
  expect(found).toEqual([]);
});
