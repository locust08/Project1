import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = "https://www.thibaultguignand.com";
const OUTPUT_ROOT = path.join(process.cwd(), "reference-captures");
const ROUTES = [
  { route: "/en", slug: "home" },
  { route: "/en/about", slug: "about" },
  { route: "/en/project/atelier-stratus", slug: "atelier-stratus" },
  { route: "/en/project/metropole", slug: "metropole" },
  { route: "/en/project/acheterduneuf", slug: "acheterduneuf" },
  { route: "/en/project/vickies", slug: "vickies" },
  { route: "/en/project/adn-family", slug: "adn-family" },
  { route: "/en/project/atypica", slug: "atypica" },
];

async function ensureDir(dirPath) {
  await mkdir(dirPath, { recursive: true });
}

async function waitForMedia(page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1500);

  try {
    await page.waitForLoadState("networkidle", { timeout: 8000 });
  } catch {
    // Some pages keep streaming media requests alive, so we continue once
    // the page has had a stable pause.
  }

  try {
    await page.waitForFunction(
      () => {
        const images = [...document.images].every((img) => img.complete);
        const videos = [...document.querySelectorAll("video")].every((video) => {
          const ready = video.readyState >= 1;
          return ready || !video.currentSrc;
        });
        return images && videos;
      },
      { timeout: 8000 },
    );
  } catch {
    // Project pages lazy-load and scrub videos; a best-effort wait is enough
    // for screenshot capture once the page has been scrolled.
  }

  await page.waitForTimeout(2000);
}

async function scrollPage(page) {
  await page.evaluate(async () => {
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const target = document.scrollingElement ?? document.documentElement;
    const maxScroll = target.scrollHeight - window.innerHeight;
    let current = 0;

    while (current < maxScroll) {
      current = Math.min(current + window.innerHeight * 0.7, maxScroll);
      window.scrollTo({ top: current, behavior: "instant" });
      await delay(350);
    }

    await delay(1200);
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.waitForTimeout(1000);
}

async function captureRoute(page, { route, slug }) {
  const url = `${BASE_URL}${route}`;
  const routeDir = path.join(OUTPUT_ROOT, slug);
  await ensureDir(routeDir);

  await page.goto(url, { waitUntil: "domcontentloaded" });
  await waitForMedia(page);
  await scrollPage(page);
  await waitForMedia(page);

  await page.screenshot({
    path: path.join(routeDir, "full.png"),
    fullPage: true,
  });

  const text = await page.evaluate(() => document.body.innerText);
  await writeFile(path.join(routeDir, "text.txt"), text, "utf8");

  const meta = await page.evaluate(() => ({
    title: document.title,
    hrefs: [...document.querySelectorAll("a[href]")].map((anchor) => ({
      text: anchor.textContent?.trim() ?? "",
      href: anchor.href,
    })),
    buttons: [...document.querySelectorAll("button, [role='button']")].map(
      (button) => ({
        text: button.textContent?.trim() ?? "",
        aria: button.getAttribute("aria-label"),
      }),
    ),
  }));

  await writeFile(
    path.join(routeDir, "meta.json"),
    JSON.stringify(meta, null, 2),
    "utf8",
  );

  console.log(`Captured ${route}`);
}

async function main() {
  await ensureDir(OUTPUT_ROOT);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  try {
    for (const route of ROUTES) {
      await captureRoute(page, route);
    }
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
