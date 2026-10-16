import { test, expect } from "@playwright/test";

// Search engines find the site through /sitemap.xml, which robots.txt names.
// Every room lives at one address, so the sitemap lists only that address, and
// it must be the page's canonical one or the two would contradict each other.
const site = "https://shelf-life.isaacvelando.com";

async function sitemapUrls(
  request: import("@playwright/test").APIRequestContext,
) {
  const response = await request.get("/sitemap.xml");
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toMatch(/xml/);
  const xml = await response.text();
  expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
  return [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
}

test("@smoke robots.txt allows crawling and names the sitemap", async ({
  request,
}) => {
  const response = await request.get("/robots.txt");
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toMatch(/^text\/plain/);
  const robots = await response.text();
  expect(robots).toMatch(/^User-agent: \*$/m);
  expect(robots).not.toMatch(/^Disallow: \/\s*$/m);
  expect(robots).toMatch(new RegExp(`^Sitemap: ${site}/sitemap\\.xml$`, "m"));
});

test("@smoke the sitemap lists the Library's one address", async ({
  request,
}) => {
  expect(await sitemapUrls(request)).toEqual([`${site}/`]);
});

test("the sitemap's address is the page's canonical address", async ({
  page,
  request,
}) => {
  for (const url of await sitemapUrls(request)) {
    await page.goto(url.slice(site.length));
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      url,
    );
  }
});
