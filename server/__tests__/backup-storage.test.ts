import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const originalCwd = process.cwd();
let temporaryCwd: string;

beforeAll(async () => {
  temporaryCwd = await fs.mkdtemp(path.join(os.tmpdir(), "cms-local-backups-"));
  process.chdir(temporaryCwd);
  vi.resetModules();
});

afterAll(async () => {
  process.chdir(originalCwd);
  await fs.rm(temporaryCwd, { recursive: true, force: true });
});

describe("local backup storage", () => {
  it("writes, lists, reads, and deletes backup objects outside /uploads", async () => {
    const storage = await import("../services/backup-storage.service");
    const body = Buffer.from("backup payload");

    expect(await storage.isBackupStorageConfigured()).toBe(true);
    expect(await storage.getBackupStorageInfo()).toMatchObject({
      prefix: "system-backups",
      source: "local",
    });

    await storage.uploadBackupObject("db/example.json.gz", body, "application/json");
    await expect(fs.stat(path.join(temporaryCwd, "uploads", "system-backups", "db", "example.json.gz"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(fs.stat(path.join(temporaryCwd, ".private", "system-backups", "db", "example.json.gz"))).resolves.toBeDefined();
    expect(await storage.downloadBackupObject("db/example.json.gz")).toEqual(body);
    expect(await storage.listBackupObjects("db")).toEqual([
      expect.objectContaining({ key: "db/example.json.gz", size: body.length }),
    ]);

    await storage.deleteBackupObject("db/example.json.gz");
    expect(await storage.downloadBackupObject("db/example.json.gz")).toBeNull();
  });

  it("migrates legacy public backup files into private storage", async () => {
    const legacyPath = path.join(temporaryCwd, "uploads", "system-backups", "db", "legacy.json.gz");
    await fs.mkdir(path.dirname(legacyPath), { recursive: true });
    await fs.writeFile(legacyPath, "legacy backup");
    const storage = await import("../services/backup-storage.service");

    expect(await storage.downloadBackupObject("db/legacy.json.gz")).toEqual(Buffer.from("legacy backup"));
    await expect(fs.stat(legacyPath)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rejects keys that escape the backup directory", async () => {
    const storage = await import("../services/backup-storage.service");
    await expect(storage.downloadBackupObject("../outside.txt")).rejects.toThrow("Invalid backup key");
  });
});
