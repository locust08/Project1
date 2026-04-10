import { cp, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE_URL = "https://www.thibaultguignand.com";
const PUBLIC_DIR = path.join(process.cwd(), "public");
const REFERENCE_ROOT = path.join(PUBLIC_DIR, "reference-assets");
const BUNDLE_PATHS = [
  "/assets/index-BKlZLtrc.js",
  "/assets/Project-C5TwzIyG.js",
  "/assets/About-CST3ds7D.js",
  "/assets/Minimap-hbPmgw-F.js",
  "/assets/vendor-react-Cm5AbdRb.js",
  "/assets/vendor-gsap-BocQZsVW.js",
  "/favicon.svg",
];

async function ensureDir(filePath) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

async function downloadFile(assetPath) {
  const url = `${BASE_URL}${assetPath}`;
  const outputPath = path.join(PUBLIC_DIR, assetPath.replace(/^\//, ""));
  await ensureDir(outputPath);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  await writeFile(outputPath, Buffer.from(arrayBuffer));
  console.log(`Saved ${assetPath}`);
}

async function main() {
  for (const dirName of ["fonts", "img", "vid"]) {
    await cp(
      path.join(REFERENCE_ROOT, dirName),
      path.join(PUBLIC_DIR, dirName),
      { force: true, recursive: true },
    );
    console.log(`Copied ${dirName} assets into public/${dirName}`);
  }

  for (const assetPath of BUNDLE_PATHS) {
    await downloadFile(assetPath);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
