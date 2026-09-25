import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { arrive } from "./helpers";

// The production Content-Security-Policy. CloudFront sends it (iwvelando/cloud-accounts,
// sites/shelf-life.isaacvelando.com), vite preview sends it here, and the deploy
// workflow checks the live header still matches this file.
const policy = readFileSync(
  "deploy/content-security-policy.txt",
  "utf8",
).trim();

function violations(page: Page) {
  const found: string[] = [];
  page.on("console", (m) => {
    if (m.text().includes("Content Security Policy")) found.push(m.text());
  });
  page.on("pageerror", (e) => found.push(e.message));
  return found;
}

test("preview serves the production Content-Security-Policy", async ({
  request,
}) => {
  const response = await request.get("/");
  expect(response.headers()["content-security-policy"]).toBe(policy);
});

test("every room runs under the policy", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const found = violations(page);
  await arrive(page);
  await page.getByRole("button", { name: "Look around" }).click();
  await page.getByRole("button", { name: "Pull a book" }).click();
  await expect(page.locator("#read-page .page-line")).toHaveCount(40);
  await page.getByRole("button", { name: "Check a shelf" }).click();
  await page.getByLabel("Text to find").fill("hello");
  await page.getByRole("button", { name: "Find it" }).click();
  await expect(page.locator("#find-page mark")).toHaveText("hello");
  await page.getByRole("button", { name: /A billion searchers/ }).click();
  await page.getByRole("button", { name: "Let go" }).click();
  await expect(page.locator("#fall-result")).toBeVisible();
  await page.getByRole("button", { name: /Switch to (light|dark)/ }).click();
  expect(found).toEqual([]);
});

test("the not-found page renders under the policy", async ({ page }) => {
  const found = violations(page);
  await page.goto("/404.html");
  await expect(
    page.getByRole("heading", { name: "This shelf is empty" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Back to the Library/ }),
  ).toHaveAttribute("href", "/");
  expect(found).toEqual([]);
});
