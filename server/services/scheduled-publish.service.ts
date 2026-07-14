import { storage } from "../storage";
import { logger } from "../utils/logger";

const HEARTBEAT_MS = 5 * 60_000;

export function startScheduledPublishService() {
  let timer: ReturnType<typeof setTimeout> | null = null;

  async function getNextScheduledTime(): Promise<Date | null> {
    return storage.cmsPages.getNextScheduledTime();
  }

  async function run() {
    timer = null;
    try {
      const pages = await storage.cmsPages.publishScheduledPages();
      if (pages > 0) {
        logger.app.info(`[scheduler] Auto-published ${pages} page(s)`);
      }
    } catch (err) {
      logger.app.error("[scheduler] Failed to check scheduled content:", err);
    }
    await scheduleNext();
  }

  async function scheduleNext() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    try {
      const next = await getNextScheduledTime();
      if (next) {
        const delay = Math.max(next.getTime() - Date.now(), 1000);
        const capped = Math.min(delay, HEARTBEAT_MS);
        timer = setTimeout(run, capped);
        logger.app.info(`[scheduler] Next check in ${Math.round(capped / 1000)}s`);
      } else {
        timer = setTimeout(run, HEARTBEAT_MS);
        logger.app.info(`[scheduler] No scheduled content; heartbeat in ${HEARTBEAT_MS / 1000}s`);
      }
    } catch (err) {
      logger.app.error("[scheduler] Failed to determine next schedule:", err);
      timer = setTimeout(run, HEARTBEAT_MS);
    }
  }

  run();
  logger.app.info("[scheduler] Scheduled publishing service started");
}
