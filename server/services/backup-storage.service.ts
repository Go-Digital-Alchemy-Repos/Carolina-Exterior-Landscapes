import fs from "node:fs/promises";
import path from "node:path";

interface BackupObjectSummary {
  key: string;
  size: number;
  lastModified: string | null;
}

const BACKUP_ROOT = path.resolve(process.cwd(), "uploads", "system-backups");

function normalizeKey(key: string) {
  const normalized = key.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized || normalized.split("/").includes("..")) {
    throw new Error("Invalid backup key");
  }
  return normalized;
}

function resolveBackupPath(key: string) {
  const normalized = normalizeKey(key);
  const filePath = path.resolve(BACKUP_ROOT, normalized);
  if (!filePath.startsWith(`${BACKUP_ROOT}${path.sep}`)) {
    throw new Error("Invalid backup key");
  }
  return { normalized, filePath };
}

async function ensureBackupRoot() {
  await fs.mkdir(BACKUP_ROOT, { recursive: true });
}

async function walkFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  const files: string[] = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkFiles(entryPath));
    else if (entry.isFile()) files.push(entryPath);
  }
  return files;
}

export async function isBackupStorageConfigured(): Promise<boolean> {
  await ensureBackupRoot();
  return true;
}

export async function getBackupStorageInfo() {
  await ensureBackupRoot();
  return {
    bucketName: "Local uploads",
    prefix: "/uploads/system-backups",
    source: "local" as const,
  };
}

export async function uploadBackupObject(
  key: string,
  body: Buffer,
  _contentType: string,
  _options?: { contentEncoding?: string; metadata?: Record<string, string> }
): Promise<{ key: string }> {
  const { normalized, filePath } = resolveBackupPath(key);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, body);
  return { key: normalized };
}

export async function downloadBackupObject(key: string): Promise<Buffer | null> {
  const { filePath } = resolveBackupPath(key);
  return fs.readFile(filePath).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
}

export async function listBackupObjects(relativePrefix = "", maxKeys = 100): Promise<BackupObjectSummary[]> {
  await ensureBackupRoot();
  const normalizedPrefix = relativePrefix
    ? normalizeKey(relativePrefix).replace(/\/+$/, "")
    : "";
  const searchRoot = normalizedPrefix
    ? resolveBackupPath(normalizedPrefix).filePath
    : BACKUP_ROOT;
  const files = await walkFiles(searchRoot);
  const summaries = await Promise.all(files.map(async (filePath) => {
    const stats = await fs.stat(filePath);
    return {
      key: path.relative(BACKUP_ROOT, filePath).split(path.sep).join("/"),
      size: stats.size,
      lastModified: stats.mtime.toISOString(),
    };
  }));
  return summaries
    .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
    .slice(0, maxKeys);
}

export async function deleteBackupObject(key: string): Promise<void> {
  const { filePath } = resolveBackupPath(key);
  await fs.unlink(filePath).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
  });
}
