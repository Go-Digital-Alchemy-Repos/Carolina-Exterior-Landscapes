import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, cp, readFile, readdir, stat } from "fs/promises";
import path from "path";
import sharp from "sharp";

const landscapeAssetsDir = path.resolve("client/src/features/landscape-site/assets");

async function optimizeLandscapeImages(directory = landscapeAssetsDir) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const sourcePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await optimizeLandscapeImages(sourcePath);
      continue;
    }
    if (!entry.name.endsWith(".png") || ["brand-sheet.png", "logo-full.png", "logo-icon.png"].includes(entry.name)) {
      continue;
    }

    const outputPath = sourcePath.replace(/\.png$/i, ".webp");
    const [sourceStats, outputStats] = await Promise.all([
      stat(sourcePath),
      stat(outputPath).catch(() => null),
    ]);
    if (outputStats && outputStats.mtimeMs >= sourceStats.mtimeMs) continue;

    await sharp(sourcePath).webp({ quality: 82, effort: 4 }).toFile(outputPath);
  }
}

async function publishLandscapeImages() {
  await cp(landscapeAssetsDir, "dist/public/images/landscape", {
    recursive: true,
    filter(source) {
      const extension = path.extname(source).toLowerCase();
      return extension === "" || [".webp", ".svg"].includes(extension) || /logo-(full|icon)\.png$/i.test(source);
    },
  });
}

async function buildAll() {
  await rm("dist", { recursive: true, force: true });
  const packageJson = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  ) as { version?: string };

  console.log("optimizing landscape images...");
  await optimizeLandscapeImages();

  console.log("building client...");
  await viteBuild();

  console.log("publishing landscape images...");
  await publishLandscapeImages();

  console.log("building server...");
  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
      __APP_VERSION__: JSON.stringify(packageJson.version ?? "unknown"),
    },
    minify: true,
    packages: "bundle",
    logLevel: "info",
  });

  console.log("copying migrations...");
  await cp("migrations", "dist/migrations", { recursive: true });

  console.log("copying docs...");
  await cp("docs", "dist/docs", { recursive: true });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
