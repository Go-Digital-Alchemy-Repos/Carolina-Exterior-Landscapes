import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import {
  enforceRequiredSecrets,
  securityHeaders,
  apiLimiter,
  originCheck,
} from "./middleware/security";
import { logger, requestIdMiddleware } from "./utils/logger";
import { recordRequest, getMetricsSnapshot } from "./utils/metrics";
import { startScheduledPublishService } from "./services/scheduled-publish.service";
import { startSystemBackupService } from "./services/system-backup.service";
import { resolveBestLocalCmsImagePath } from "./services/cms-image-variants.service";

declare const __APP_VERSION__: string;
const pkgVersion = typeof __APP_VERSION__ === "string" ? __APP_VERSION__ : "unknown";

enforceRequiredSecrets();

const app = express();
app.set("trust proxy", 1);
const httpServer = createServer(app);
const landscapeAssetsPath = path.resolve(process.cwd(), "client", "src", "features", "landscape-site", "assets");
const cmsUploadsPath = path.resolve(process.cwd(), "uploads", "cms");

app.use(securityHeaders());
app.use(requestIdMiddleware);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: "1mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  const mem = process.memoryUsage();
  res.json({
    status: "ok",
    version: pkgVersion,
    nodeVersion: process.version,
    uptime: Math.floor(process.uptime()),
    memory: {
      rss: Math.round(mem.rss / 1024 / 1024),
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      external: Math.round(mem.external / 1024 / 1024),
    },
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health/ready", async (_req, res) => {
  try {
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    await db.execute(sql`SELECT 1`);
    res.json({
      status: "ready",
      database: "connected",
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.db.error("Readiness check failed", err);
    res.status(503).json({
      status: "not_ready",
      database: "disconnected",
      timestamp: new Date().toISOString(),
    });
  }
});

app.get("/api/health/metrics", (req, res) => {
  if (process.env.NODE_ENV === "production" && process.env.METRICS_ENABLED !== "true") {
    return res.status(404).json({ message: "Not found" });
  }
  res.json(getMetricsSnapshot());
});

app.use("/api", apiLimiter);
app.use(originCheck);

function negotiateLocalCmsUploadImageFormat(req: Request, res: Response, next: NextFunction) {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  if (!/\.(webp|png|jpe?g)$/i.test(req.path)) return next();

  const requestedPath = path.resolve(cmsUploadsPath, `.${req.path}`);
  if (!requestedPath.startsWith(cmsUploadsPath)) return next();

  const bestVariant = resolveBestLocalCmsImagePath(requestedPath, req.headers.accept);
  if (!bestVariant || bestVariant.filePath === requestedPath) return next();

  res.vary("Accept");
  res.setHeader("Content-Type", bestVariant.mimeType);
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  return res.sendFile(bestVariant.filePath);
}

app.use(
  "/uploads/cms",
  negotiateLocalCmsUploadImageFormat,
  express.static(cmsUploadsPath, {
    immutable: true,
    maxAge: "1y",
  }),
);
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

function negotiateLandscapeImageFormat(req: Request, res: Response, next: NextFunction) {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  if (!/\.(webp|png|jpe?g)$/i.test(req.path)) return next();

  const requestedPath = path.resolve(landscapeAssetsPath, `.${req.path}`);
  if (!requestedPath.startsWith(landscapeAssetsPath)) return next();

  const bestVariant = resolveBestLocalCmsImagePath(requestedPath, req.headers.accept);
  if (!bestVariant || bestVariant.filePath === requestedPath) return next();

  res.vary("Accept");
  res.setHeader("Content-Type", bestVariant.mimeType);
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  return res.sendFile(bestVariant.filePath);
}

app.use(
  "/images/landscape",
  negotiateLandscapeImageFormat,
  express.static(landscapeAssetsPath, {
    immutable: true,
    maxAge: "1y",
  }),
);

const REDACTED_KEYS = [
  "password", "currentPassword", "newPassword",
  "token", "resetToken", "secret", "authorization",
  "email", "phone", "address", "addressLine1", "addressLine2",
  "refereeEmail", "refereePhone", "ssn", "dateOfBirth",
  "secureToken",
];
const MAX_LOG_BODY_LENGTH = 500;

function redactSensitive(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map((item) => redactSensitive(item));
  const redacted: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    if (REDACTED_KEYS.some((rk) => key.toLowerCase().includes(rk.toLowerCase()))) {
      redacted[key] = "[REDACTED]";
    } else if (key === "bio" || key === "content" || key === "body" || key === "description") {
      const val = obj[key];
      redacted[key] = typeof val === "string" && val.length > 100 ? val.substring(0, 100) + "..." : val;
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      redacted[key] = redactSensitive(obj[key]);
    } else {
      redacted[key] = obj[key];
    }
  }
  return redacted;
}

function truncateBody(body: string): string {
  if (body.length > MAX_LOG_BODY_LENGTH) {
    return body.substring(0, MAX_LOG_BODY_LENGTH) + `...[truncated ${body.length} chars]`;
  }
  return body;
}

app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      recordRequest(req.method, reqPath, duration, res.statusCode);

      let bodyStr = "";
      if (capturedJsonResponse) {
        bodyStr = truncateBody(JSON.stringify(redactSensitive(capturedJsonResponse)));
      }

      logger.http.info(`${req.method} ${reqPath} ${res.statusCode} ${duration}ms`, {
        requestId: req.requestId,
        method: req.method,
        path: reqPath,
        statusCode: res.statusCode,
        durationMs: duration,
        ...(bodyStr ? { body: bodyStr } : {}),
      });
    }
  });

  next();
});

(async () => {
  if (process.env.NODE_ENV === "production") {
    const { runMigrations } = await import("./migrate");
    await runMigrations();
  }

  {
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    await db.execute(sql`ALTER TABLE IF EXISTS "cms_media" ADD COLUMN IF NOT EXISTS "variants" jsonb`);
    await db.execute(sql`ALTER TABLE IF EXISTS "seo_settings" ADD COLUMN IF NOT EXISTS "custom_head_tags" text`);
    await db.execute(sql`ALTER TABLE IF EXISTS "seo_settings" ADD COLUMN IF NOT EXISTS "custom_body_start_tags" text`);
    await db.execute(sql`ALTER TABLE IF EXISTS "seo_settings" ADD COLUMN IF NOT EXISTS "custom_body_end_tags" text`);
  }

  const { runSystemBootstrap } = await import("./services/system-bootstrap.service");
  await runSystemBootstrap();

  await registerRoutes(httpServer, app);

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;

    logger.app.error(`${req.method} ${req.path} ${status}`, err, {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: status,
    });

    if (res.headersSent) {
      return next(err);
    }

    const isProduction = process.env.NODE_ENV === "production";
    const message =
      status >= 500 && isProduction
        ? "Internal Server Error"
        : err.message || "Internal Server Error";

    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  startScheduledPublishService();
  startSystemBackupService();

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      logger.app.info(`Serving on port ${port}`);
    },
  );
})();
