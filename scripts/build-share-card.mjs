// Renders the link-preview card (public/og-image.png) and the home-screen icon
// (public/apple-touch-icon.png) from the built site, so they carry the Library's
// own shaft, type, and colours. Run after `npm run build`, check the images by eye,
// and commit them; they change only when the site's look does.
import { chromium } from "@playwright/test";
import { preview } from "vite";

const server = await preview({ preview: { port: 4174, strictPort: true } });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    colorScheme: "dark",
    // The shaft holds still.
    reducedMotion: "reduce",
  });
  await page.goto("http://127.0.0.1:4174/");
  await page.locator("html[data-engine=ready]").waitFor();

  // The Look room's shaft, over the title and subtitle, centred so a square crop
  // keeps all three.
  await page.evaluate(() => {
    const shaft = document.querySelector("svg.shaft");
    const card = document.createElement("main");
    card.style.cssText = `
      width: 1200px; height: 630px; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 22px;
      background: var(--stone); color: var(--vellum); font-family: var(--serif);`;
    shaft.style.cssText = "width: 380px; margin-bottom: 6px";
    const title = document.createElement("div");
    title.textContent = "Shelf Life";
    title.style.cssText = "font-size: 68px; line-height: 1";
    const subtitle = document.createElement("div");
    subtitle.textContent = "a short stay in the Library";
    subtitle.style.cssText =
      "font-size: 28px; font-style: italic; color: var(--gilt)";
    card.append(shaft, title, subtitle);
    document.body.replaceChildren(card);
    document.body.style.margin = "0";
  });
  await page.screenshot({ path: "public/og-image.png" });

  // iOS rounds the corners itself and fills transparency with black.
  await page.setViewportSize({ width: 180, height: 180 });
  await page.evaluate(() => {
    const icon = document.createElement("img");
    icon.src = "./shelf-life.svg";
    icon.style.cssText =
      "width: 140px; height: 140px; margin: 20px; display: block";
    document.body.replaceChildren(icon);
    document.body.style.background = "var(--stone)";
    return icon.decode();
  });
  await page.screenshot({ path: "public/apple-touch-icon.png" });
} finally {
  await browser.close();
  await new Promise((done) => server.httpServer.close(done));
}
console.log("Wrote public/og-image.png and public/apple-touch-icon.png.");
