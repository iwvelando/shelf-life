import { test, expect } from "@playwright/test";
import { arrive, problems } from "./helpers";

// Safari's engine, which every iOS browser also uses, at phone size.
test("the rooms work in WebKit on a phone", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const found = problems(page);
  await arrive(page);
  await page.getByRole("button", { name: "Pull a book" }).click();
  await expect(page.locator("#read-page .page-line")).toHaveCount(40);
  await page.getByRole("button", { name: "Check a shelf" }).click();
  await expect(page.locator("#search-fraction")).toContainText("zeros");
  await page.getByLabel("Text to find").fill("Wyatt");
  await page.getByRole("button", { name: "Find it" }).click();
  await expect(page.locator("#find-page mark")).toHaveText("wyatt");
  await page.getByRole("button", { name: /A billion searchers/ }).click();
  await expect(page.locator("#reckon-removed")).toContainText("18");
  await page.getByRole("button", { name: "Let go" }).click();
  await expect(page.locator("#fall-result")).toContainText("14,256");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  expect(found).toEqual([]);
});
