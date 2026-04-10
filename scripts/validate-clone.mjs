import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import net from "node:net";
import { execFileSync, spawn } from "node:child_process";
import { chromium } from "playwright";

const HOST = "127.0.0.1";
const REFERENCE_URL = "https://www.thibaultguignand.com";
const OUTPUT_ROOT = path.join(process.cwd(), "validation-captures");
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

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, HOST, () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Failed to determine an open port."));
        return;
      }

      const { port } = address;
      server.close(() => resolve(port));
    });
    server.on("error", reject);
  });
}

function stopExistingDevServers() {
  if (process.platform !== "win32") {
    return;
  }

  const escapedCwd = process.cwd().replace(/\\/g, "\\\\");
  const script = `
    Get-CimInstance Win32_Process |
      Where-Object {
        $_.CommandLine -and
        $_.ProcessId -ne ${process.pid} -and
        $_.CommandLine -like '*${escapedCwd}*' -and
        $_.CommandLine -like '*next dev*'
      } |
      ForEach-Object {
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
      }
  `;

  try {
    execFileSync("powershell.exe", ["-NoProfile", "-Command", script], {
      stdio: "ignore",
    });
  } catch {
    // A stale dev server is best-effort cleanup; validation can continue.
  }
}

function startDevServer(port) {
  const nextBin = path.join(
    process.cwd(),
    "node_modules",
    "next",
    "dist",
    "bin",
    "next",
  );

  const child = spawn(
    process.execPath,
    [nextBin, "dev", "--hostname", HOST, "--port", String(port)],
    {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  child.stdout.on("data", (chunk) => process.stdout.write(chunk));
  child.stderr.on("data", (chunk) => process.stderr.write(chunk));

  return child;
}

async function waitForServer(baseUrl) {
  const deadline = Date.now() + 30_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/en`, { redirect: "manual" });
      if (response.ok) {
        return;
      }
    } catch {
      // Retry until the server is ready.
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error("Timed out waiting for the local Next.js server.");
}

async function waitForMedia(page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1500);

  try {
    await page.waitForLoadState("networkidle", { timeout: 8000 });
  } catch {}

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
  } catch {}

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

async function captureComparableState(page, url, screenshotPath) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await waitForMedia(page);
  await scrollPage(page);
  await waitForMedia(page);

  const title = await page.title();
  const text = await page.evaluate(() => document.body.innerText);

  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
  });

  return { title, text };
}

async function main() {
  await mkdir(OUTPUT_ROOT, { recursive: true });
  stopExistingDevServers();
  const port = await getFreePort();
  const baseUrl = `http://${HOST}:${port}`;
  const server = startDevServer(port);

  try {
    await waitForServer(baseUrl);

    const browser = await chromium.launch({ headless: true });
    const results = [];

    try {
      for (const { route, slug } of ROUTES) {
        const localShot = path.join(OUTPUT_ROOT, `${slug}-local.png`);
        const referenceShot = path.join(OUTPUT_ROOT, `${slug}-reference.png`);
        const localContext = await browser.newContext({
          viewport: { width: 1440, height: 900 },
          deviceScaleFactor: 1,
        });
        const referenceContext = await browser.newContext({
          viewport: { width: 1440, height: 900 },
          deviceScaleFactor: 1,
        });
        const localPage = await localContext.newPage();
        const referencePage = await referenceContext.newPage();

        const [localState, referenceState] = await Promise.all([
          captureComparableState(localPage, `${baseUrl}${route}`, localShot),
          captureComparableState(
            referencePage,
            `${REFERENCE_URL}${route}`,
            referenceShot,
          ),
        ]);

        const titleMatch = localState.title === referenceState.title;
        const textMatch = localState.text === referenceState.text;

        const result = {
          route,
          titleMatch,
          textMatch,
          localTitle: localState.title,
          referenceTitle: referenceState.title,
          localTextLength: localState.text.length,
          referenceTextLength: referenceState.text.length,
        };

        results.push(result);
        console.log(
          `${route} :: titleMatch=${titleMatch} textMatch=${textMatch}`,
        );

        await localContext.close();
        await referenceContext.close();
      }
    } finally {
      await browser.close();
    }

    await writeFile(
      path.join(OUTPUT_ROOT, "results.json"),
      JSON.stringify(results, null, 2),
      "utf8",
    );
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
