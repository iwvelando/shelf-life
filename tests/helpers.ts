import { expect, type Page } from "@playwright/test";

// The engine loads in a worker after first paint; the page marks when it can answer.
export async function arrive(page: Page, path = "/") {
  await page.goto(path);
  await expect(page.locator("html")).toHaveAttribute("data-engine", "ready", {
    timeout: 20_000,
  });
}

// Collects console errors, page errors, failed requests, and error responses.
export function problems(page: Page) {
  const found: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") found.push(m.text());
  });
  page.on("pageerror", (e) => found.push(e.message));
  page.on("requestfailed", (r) => found.push(`${r.url()} failed`));
  page.on("response", (r) => {
    if (r.status() >= 400) found.push(`${r.url()} returned ${r.status()}`);
  });
  return found;
}

export const pageText = async (page: Page, selector: string) =>
  (await page.locator(`${selector} .page-line`).allTextContents()).join("");

// Treats "1,234" as 1234.
export const count = (text: string | null) =>
  Number((text ?? "").replace(/[^\d]/g, ""));
