import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ASSETS_DIR = path.resolve(process.cwd(), "client/src/features/landscape-site/assets");
const SOURCE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);

type OptimizeResult = {
  source: string;
  sourceBytes: number;
  avifBytes: number;
  webpBytes: number;
};

async function findRasterImages(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = path.join(dir, entry.name);
      if (entry.isDirectory()) return findRasterImages(absolutePath);
      if (!entry.isFile()) return [];
      return SOURCE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()) ? [absolutePath] : [];
    }),
  );
  return files.flat().sort((a, b) => a.localeCompare(b));
}

async function optimizeImage(sourcePath: string): Promise<OptimizeResult> {
  const extension = path.extname(sourcePath);
  const basePath = sourcePath.slice(0, -extension.length);
  const avifPath = `${basePath}.avif`;
  const webpPath = `${basePath}.webp`;
  const source = sharp(sourcePath, { failOn: "none" }).rotate();

  await Promise.all([
    source
      .clone()
      .avif({ effort: 5, quality: 50 })
      .toFile(avifPath),
    source
      .clone()
      .webp({ effort: 5, quality: 76 })
      .toFile(webpPath),
  ]);

  const [sourceStat, avifStat, webpStat] = await Promise.all([
    fs.stat(sourcePath),
    fs.stat(avifPath),
    fs.stat(webpPath),
  ]);

  return {
    source: path.relative(ASSETS_DIR, sourcePath),
    sourceBytes: sourceStat.size,
    avifBytes: avifStat.size,
    webpBytes: webpStat.size,
  };
}

function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function main() {
  const images = await findRasterImages(ASSETS_DIR);
  const results: OptimizeResult[] = [];

  for (const image of images) {
    results.push(await optimizeImage(image));
  }

  const sourceTotal = results.reduce((sum, result) => sum + result.sourceBytes, 0);
  const avifTotal = results.reduce((sum, result) => sum + result.avifBytes, 0);
  const webpTotal = results.reduce((sum, result) => sum + result.webpBytes, 0);

  console.log(`Optimized ${results.length} landscape raster images.`);
  console.log(`Original total: ${formatBytes(sourceTotal)}`);
  console.log(`AVIF total: ${formatBytes(avifTotal)}`);
  console.log(`WebP total: ${formatBytes(webpTotal)}`);

  const largestSavings = results
    .slice()
    .sort((a, b) => b.sourceBytes - b.avifBytes - (a.sourceBytes - a.avifBytes))
    .slice(0, 8);

  for (const result of largestSavings) {
    console.log(
      `${result.source}: ${formatBytes(result.sourceBytes)} -> ${formatBytes(result.avifBytes)} AVIF / ${formatBytes(result.webpBytes)} WebP`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
