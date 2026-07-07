import { Router } from "express";
import { sql } from "drizzle-orm";
import { db } from "../../db";
import { asyncHandler } from "../../middleware/error-handler";
import { MemoryCache } from "../../lib/cache";
import {
  activityLogs,
  cmsForms,
  cmsFormSubmissions,
  cmsMedia,
  cmsPages,
  cmsSections,
  contactMessages,
  users,
} from "@shared/schema";

const router = Router();

const ANALYTICS_CACHE_TTL = parseInt(process.env.DASHBOARD_ANALYTICS_CACHE_TTL || "300", 10);
const analyticsCache = new MemoryCache<Record<string, unknown>>(ANALYTICS_CACHE_TTL);
const ANALYTICS_CACHE_KEY = "dashboard_analytics";

router.get(
  "/dashboard-stats",
  asyncHandler(async (_req, res) => {
    const [totalUsers, publishedPages, draftPages, totalForms, unreadMessages, mediaAssets] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(users),
      db.select({ count: sql<number>`count(*)` }).from(cmsPages).where(sql`${cmsPages.status} = 'published'`),
      db.select({ count: sql<number>`count(*)` }).from(cmsPages).where(sql`${cmsPages.status} <> 'published'`),
      db.select({ count: sql<number>`count(*)` }).from(cmsForms),
      db.select({ count: sql<number>`count(*)` }).from(contactMessages).where(sql`${contactMessages.isRead} = false`),
      db.select({ count: sql<number>`count(*)` }).from(cmsMedia),
    ]);

    res.json({
      totalUsers: Number(totalUsers[0]?.count ?? 0),
      publishedPages: Number(publishedPages[0]?.count ?? 0),
      draftPages: Number(draftPages[0]?.count ?? 0),
      totalForms: Number(totalForms[0]?.count ?? 0),
      unreadMessages: Number(unreadMessages[0]?.count ?? 0),
      mediaAssets: Number(mediaAssets[0]?.count ?? 0),
    });
  }),
);

router.get(
  "/dashboard-analytics",
  asyncHandler(async (_req, res) => {
    const cached = analyticsCache.get(ANALYTICS_CACHE_KEY);
    if (cached) {
      return res.json(cached);
    }

    const [usersByRole, pagesByStatus, submissionsTrend, contactsTrend, recentActivity, totalSections] = await Promise.all([
      db
        .select({
          role: users.role,
          count: sql<number>`count(*)`,
        })
        .from(users)
        .groupBy(users.role),

      db
        .select({
          status: cmsPages.status,
          count: sql<number>`count(*)`,
        })
        .from(cmsPages)
        .groupBy(cmsPages.status),

      db
        .select({
          month: sql<string>`to_char(${cmsFormSubmissions.createdAt}, 'YYYY-MM')`,
          count: sql<number>`count(*)`,
        })
        .from(cmsFormSubmissions)
        .where(sql`${cmsFormSubmissions.createdAt} >= now() - interval '6 months'`)
        .groupBy(sql`to_char(${cmsFormSubmissions.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${cmsFormSubmissions.createdAt}, 'YYYY-MM')`),

      db
        .select({
          month: sql<string>`to_char(${contactMessages.createdAt}, 'YYYY-MM')`,
          count: sql<number>`count(*)`,
        })
        .from(contactMessages)
        .where(sql`${contactMessages.createdAt} >= now() - interval '6 months'`)
        .groupBy(sql`to_char(${contactMessages.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${contactMessages.createdAt}, 'YYYY-MM')`),

      db
        .select({
          id: activityLogs.id,
          userId: activityLogs.userId,
          action: activityLogs.action,
          details: activityLogs.details,
          createdAt: activityLogs.createdAt,
          firstName: users.firstName,
          lastName: users.lastName,
        })
        .from(activityLogs)
        .leftJoin(users, sql`${activityLogs.userId} = ${users.id}`)
        .orderBy(sql`${activityLogs.createdAt} desc`)
        .limit(15),

      db.select({ count: sql<number>`count(*)` }).from(cmsSections),
    ]);

    const result = {
      usersByRole: usersByRole.map((row) => ({ role: row.role, count: Number(row.count) })),
      pagesByStatus: pagesByStatus.map((row) => ({ status: row.status, count: Number(row.count) })),
      submissionsTrend: submissionsTrend.map((row) => ({ month: row.month, count: Number(row.count) })),
      contactsTrend: contactsTrend.map((row) => ({ month: row.month, count: Number(row.count) })),
      recentActivity: recentActivity.map((row) => ({
        id: row.id,
        userId: row.userId,
        action: row.action,
        details: row.details,
        createdAt: row.createdAt,
        userName: row.firstName || row.lastName ? [row.firstName, row.lastName].filter(Boolean).join(" ") : "Unknown",
      })),
      totalSections: Number(totalSections[0]?.count ?? 0),
    };

    analyticsCache.set(ANALYTICS_CACHE_KEY, result);
    res.json(result);
  }),
);

export default router;
