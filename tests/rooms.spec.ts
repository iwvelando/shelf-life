import { test, expect } from "@playwright/test";
import { arrive, count, pageText } from "./helpers";

test.beforeEach(async ({ page }) => {
  // The fall plays its sequence instantly; everything else is unaffected.
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("the arrival states the size of the Library before the engine loads", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#look")).toContainText("× 10^1,918,666 books");
  await expect(page.locator("#shaft")).toBeVisible();
  const before = await page.locator("#look-view").textContent();
  await page.getByRole("button", { name: "Look around" }).click();
  await expect(page.locator("#look-view")).not.toHaveText(before ?? "");
});

test("reading pulls a real page and turning it moves to the next page", async ({
  page,
}) => {
  await arrive(page);
  await page.getByRole("button", { name: "Pull a book" }).click();
  const lines = page.locator("#read-page .page-line");
  await expect(lines).toHaveCount(40);
  for (const line of await lines.allTextContents())
    expect(line).toMatch(/^[a-z ,.]{80}$/);
  const hexagon = await page.locator("#read-location .hexagon").textContent();
  expect(hexagon?.replace(/\D/g, "").length).toBeGreaterThan(4000);
  const first = await pageText(page, "#read-page");
  const pageNumber = count(
    await page.locator("#read-location .page-number").textContent(),
  );
  // Turning past the last page is refused rather than wrapped.
  if (pageNumber < 410) {
    await page.getByRole("button", { name: "Turn the page" }).click();
    await expect(page.locator("#read-location .page-number")).toHaveText(
      String(pageNumber + 1),
    );
    expect(await pageText(page, "#read-page")).not.toBe(first);
  }
  await expect(page.locator("#hud-examined")).toHaveText("1");
});

test("searching raises the tally but never the fraction", async ({ page }) => {
  await arrive(page);
  await page.getByRole("button", { name: "Check a shelf" }).click();
  await expect(page.locator("#search-fraction")).toContainText("zeros");
  const first = count(await page.locator("#search-tally").textContent());
  expect(first).toBeGreaterThanOrEqual(1000);
  await page.getByRole("button", { name: "Check a shelf" }).click();
  await expect
    .poll(async () => count(await page.locator("#search-tally").textContent()))
    .toBeGreaterThan(first);
  // The run of zeros shrinks as the tally grows (1,918,660 up to ~14,800 books,
  // 1,918,659 beyond), so assert only its leading digits.
  await expect(page.locator("#search-fraction")).toContainText("(1,918,6");
  await expect(page.locator("#hud-examined")).not.toHaveText("0");
});

test("finding a text spells it the Library's way and the address checks out", async ({
  page,
}) => {
  await arrive(page);
  await page.getByLabel("Text to find").fill("Wyatt Earp, 1848");
  await page.getByRole("button", { name: "Find it" }).click();
  const spelled = "wyatt earp, one eight four eight";
  await expect(page.locator("#find-page mark")).toHaveText(spelled);
  await expect(page.locator("#find-spelling")).toContainText(spelled);
  await expect(page.locator("#find-spelling")).toContainText(
    "numbers out in words",
  );
  const digits = (
    await page.locator("#find-location .hexagon").textContent()
  )?.replace(/\D/g, "").length;
  expect(digits).toBeGreaterThan(4000);
  await page.getByRole("button", { name: "Look it up" }).click();
  await expect(page.locator("#find-check")).toHaveText(
    /same page, character for character/,
  );

  await page.getByLabel("On a blank page").check();
  await page.getByRole("button", { name: "Find it" }).click();
  await expect
    .poll(() => pageText(page, "#find-page"))
    .toBe(spelled + " ".repeat(3200 - spelled.length));
});

test("text that can't be spelled is explained, not searched", async ({
  page,
}) => {
  await arrive(page);
  await page.getByLabel("Text to find").fill("ééé");
  await page.getByRole("button", { name: "Find it" }).click();
  await expect(page.getByRole("alert")).toContainText("alphabet");
});

test("reckoning: presets and sliders barely move the exponent", async ({
  page,
}) => {
  await arrive(page);
  await page
    .getByRole("button", { name: /Every atom, once every Planck/ })
    .click();
  await expect(page.locator("#reckon-seconds")).toContainText("10^1,918,54");
  await expect(page.locator("#reckon-removed")).toContainText("123");
  await expect(page.locator("#exponent-bar")).toBeVisible();
  await page.getByLabel("Searchers").fill("0");
  await page.getByLabel("Books each checks per second").fill("0");
  await expect(page.locator("#reckon-seconds")).toContainText("10^1,918,666");
  await expect(page.locator("#reckon-fraction")).toContainText("zeros");
  await expect(page.locator("#library-cube")).toContainText("10^639,554");
});

test("falling changes nothing but the tally", async ({ page }) => {
  await arrive(page);
  await page.getByRole("button", { name: "Let go" }).click();
  await expect(page.locator("#fall-result")).toContainText("14,256");
  await expect(page.locator("#hud-deaths")).toHaveText("1");
  await expect(page.locator(".tally-mark")).toHaveCount(1);
  await page.getByRole("button", { name: "Let go" }).click();
  await expect(page.locator("#fall-result")).toContainText("9,504,000");
  await expect(page.locator(".tally-mark")).toHaveCount(2);
  await expect(page.locator("#time-spent")).toContainText("6 days");
});

test("the stay persists, and can be started over", async ({ page }) => {
  await arrive(page);
  await page.getByRole("button", { name: "Pull a book" }).click();
  await expect(page.locator("#hud-examined")).toHaveText("1");
  await arrive(page);
  await expect(page.locator("#hud-examined")).toHaveText("1");
  await expect(page.locator("#look")).toContainText("You never left.");
  await page.getByRole("button", { name: "Start the stay over" }).click();
  await expect(page.locator("#hud-examined")).toHaveText("0");
});

test("a stay works with storage denied", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("denied", "SecurityError");
      },
    });
  });
  await arrive(page);
  await page.getByRole("button", { name: "Check a shelf" }).click();
  await expect(page.locator("#search-fraction")).toContainText("zeros");
});

test("the theme follows the system until chosen, then remembers", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
