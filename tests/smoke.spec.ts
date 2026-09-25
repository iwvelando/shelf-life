import { test, expect } from "@playwright/test";
import { arrive, problems } from "./helpers";

// Post-deploy smoke test. CI also runs it against the preview build; the deploy
// runs it against the live site with BASE_URL=https://shelf-life.isaacvelando.com.
// Keep it fast and read-only.
test("@smoke the Library opens and a book can be read", async ({ page }) => {
  const found = problems(page);
  const wasm = page.waitForResponse((r) => r.url().endsWith("/engine.wasm"));
  await arrive(page);
  expect((await wasm).headers()["content-type"]).toBe("application/wasm");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "You are dead.",
  );
  await page.getByRole("button", { name: "Pull a book" }).click();
  await expect(page.locator("#read-page .page-line")).toHaveCount(40);
  expect(found).toEqual([]);
});
