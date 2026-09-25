import { test, expect } from "@playwright/test";
import { arrive } from "./helpers";

// Runs in both the desktop (chromium) and phone projects.
test("no horizontal scrolling, and the rooms are one tap away", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await arrive(page);
  await page.getByRole("button", { name: "Pull a book" }).click();
  await page.getByLabel("Text to find").fill("somewhere");
  await page.getByRole("button", { name: "Find it" }).click();
  await expect(page.locator("#find-page mark")).toBeVisible();
  await page.getByRole("button", { name: "Check a shelf" }).click();
  await page.getByRole("button", { name: /Every atom, once every/ }).click();
  await expect(page.locator("#reckon-fraction")).toContainText("zeros");
  await page.getByRole("button", { name: "Let go" }).click();
  await expect(page.locator("#fall-result")).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);

  const nav = page.getByRole("navigation", { name: "Rooms" });
  await expect(nav).toBeInViewport();
  await nav.getByRole("link", { name: "Fall" }).click();
  await expect(page.locator("#fall h2")).toBeInViewport();
  if (info.project.name === "phone") {
    // The room bar sits along the bottom of a phone screen.
    const box = await nav.boundingBox();
    const height = page.viewportSize()!.height;
    expect(box!.y + box!.height).toBeGreaterThan(height - 2);
  }
});

test("all eighty columns of a page fit without scrolling", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await arrive(page);
  await page.getByRole("button", { name: "Pull a book" }).click();
  const pageEl = page.locator("#read-page .page-text");
  await expect(pageEl).toBeVisible();
  const fits = await pageEl.evaluate((el) => el.scrollWidth <= el.clientWidth);
  expect(fits).toBe(true);
});
