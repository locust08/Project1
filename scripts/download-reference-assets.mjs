import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE_URL = "https://www.thibaultguignand.com";
const SOURCE_FILES = [
  "reference-home.html",
  "reference-index.js",
  "reference-project.js",
  "reference-about.js",
];
const OUTPUT_ROOT = path.join(process.cwd(), "public", "reference-assets");

const assetPattern =
  /\/(?:img|vid|fonts)\/[A-Za-z0-9\-_/%.]+?\.(?:svg|webp|mp4|woff2)/g;

async function ensureDir(filePath) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

async function collectAssetPaths() {
  const assets = new Set();

  for (const file of SOURCE_FILES) {
    const fullPath = path.join(process.cwd(), file);
    const content = await readFile(fullPath, "utf8");
    for (const match of content.matchAll(assetPattern)) {
      assets.add(match[0]);
    }
  }

  return [...assets].sort();
}

async function downloadAsset(assetPath) {
  const url = `${BASE_URL}${assetPath}`;
  const outputPath = path.join(OUTPUT_ROOT, assetPath.replace(/^\//, ""));

  await ensureDir(outputPath);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  await writeFile(outputPath, Buffer.from(arrayBuffer));
  return outputPath;
}

async function main() {
  const assets = await collectAssetPaths();
  console.log(`Found ${assets.length} reference assets.`);

  for (const assetPath of assets) {
    const outputPath = await downloadAsset(assetPath);
    console.log(`Saved ${assetPath} -> ${path.relative(process.cwd(), outputPath)}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
