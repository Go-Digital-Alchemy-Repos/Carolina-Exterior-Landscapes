import { execFileSync } from "node:child_process";

function ensureDatabaseUrl() {
  if (process.env.DATABASE_URL) return;

  try {
    const raw = execFileSync("railway", ["variables", "--service", "Postgres-hn5l", "--json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const variables = JSON.parse(raw) as { DATABASE_PUBLIC_URL?: string };
    if (variables.DATABASE_PUBLIC_URL) {
      process.env.DATABASE_URL = variables.DATABASE_PUBLIC_URL;
    }
  } catch {
    // Fall through to the standard db module error with a clear DATABASE_URL message.
  }
}

ensureDatabaseUrl();

const { pool } = await import("../db");
const { populateCmsSeoMetadata } = await import("../services/cms-seo-metadata-populator.service");

await populateCmsSeoMetadata()
  .then((result) => {
    console.log(
      `Updated ${result.updatedPages} CMS pages, ${result.updatedMedia} media images, and global SEO settings.`,
    );
  })
  .finally(async () => {
    await pool.end();
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
