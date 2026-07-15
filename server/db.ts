import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import tls from "node:tls";
import * as schema from "@shared/schema";
import { recordDbQuery } from "./utils/metrics";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const isProduction = process.env.NODE_ENV === "production";

function databaseSslConfig(): pg.PoolConfig["ssl"] {
  if (isProduction) {
    if (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "false") {
      throw new Error("DATABASE_SSL_REJECT_UNAUTHORIZED=false is not allowed in production");
    }
    const ca = process.env.DATABASE_SSL_CA?.replace(/\\n/g, "\n");
    const expectedName = process.env.DATABASE_SSL_EXPECTED_NAME;
    return {
      rejectUnauthorized: true,
      ...(ca ? { ca } : {}),
      ...(expectedName
        ? {
            checkServerIdentity: (_hostname: string, certificate: tls.PeerCertificate) =>
              tls.checkServerIdentity(expectedName, certificate),
          }
        : {}),
    };
  }
  if (process.env.DATABASE_SSL === "true") {
    const ca = process.env.DATABASE_SSL_CA?.replace(/\\n/g, "\n");
    return { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false", ...(ca ? { ca } : {}) };
  }
  return undefined;
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: databaseSslConfig(),
});

const origPoolQuery = Pool.prototype.query;
Pool.prototype.query = function patchedQuery(this: pg.Pool, ...args: unknown[]) {
  const start = Date.now();
  const result = origPoolQuery.apply(this, args as Parameters<typeof origPoolQuery>);
  if (result != null && typeof result === "object" && "then" in result) {
    (result as Promise<unknown>).then(
      () => recordDbQuery(Date.now() - start),
      () => recordDbQuery(Date.now() - start),
    );
  }
  return result;
} as typeof origPoolQuery;

export const db = drizzle(pool, { schema });
