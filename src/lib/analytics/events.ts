import { and, desc, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/lib/db/client";
import { analyticsEvents } from "@/lib/db/schema";

const analyticsPropertyValueSchema = z.union([z.string().max(1000), z.number().finite(), z.boolean(), z.null()]);
const analyticsPropertiesSchema = z
  .record(z.string().min(1).max(64), analyticsPropertyValueSchema)
  .refine((value) => Object.keys(value).length <= 30, "properties can contain at most 30 keys")
  .refine((value) => JSON.stringify(value).length <= 8_192, "properties payload is too large")
  .default({});

export const analyticsEventInputSchema = z.object({
  eventName: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9_.:-]+$/i, "eventName must use stable analytics-safe characters"),
  sessionId: z.string().min(8).max(160),
  path: z.string().min(1).max(500).startsWith("/"),
  referrer: z.string().max(2000).optional().nullable(),
  properties: analyticsPropertiesSchema.optional()
});

export type AnalyticsEventInput = z.infer<typeof analyticsEventInputSchema>;

export function normalizeAnalyticsPath(path: string) {
  if (!path.startsWith("/")) {
    return "/";
  }

  try {
    const url = new URL(path, "https://example.com");
    return `${url.pathname}${url.search}`.slice(0, 500);
  } catch {
    return path.slice(0, 500);
  }
}

export async function trackAnalyticsEvent(input: AnalyticsEventInput & { userId?: string | null; userAgent?: string | null }) {
  const event = analyticsEventInputSchema.parse({
    ...input,
    path: normalizeAnalyticsPath(input.path)
  });

  await getDb().insert(analyticsEvents).values({
    eventName: event.eventName,
    sessionId: event.sessionId,
    userId: input.userId ?? null,
    path: event.path,
    referrer: event.referrer || null,
    userAgent: input.userAgent || null,
    properties: event.properties ?? {}
  });
}

export async function listRecentAnalyticsEvents(limit = 20) {
  return getDb()
    .select({
      id: analyticsEvents.id,
      eventName: analyticsEvents.eventName,
      sessionId: analyticsEvents.sessionId,
      userId: analyticsEvents.userId,
      path: analyticsEvents.path,
      referrer: analyticsEvents.referrer,
      createdAt: analyticsEvents.createdAt
    })
    .from(analyticsEvents)
    .orderBy(desc(analyticsEvents.createdAt))
    .limit(limit);
}

export async function getAnalyticsSummary(days = 14) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const db = getDb();
  const [[totals], pageViews, eventsByDay] = await Promise.all([
    db.select({
      events: sql<number>`count(*)::int`,
      sessions: sql<number>`count(distinct ${analyticsEvents.sessionId})::int`,
      users: sql<number>`count(distinct ${analyticsEvents.userId})::int`
    }).from(analyticsEvents).where(gte(analyticsEvents.createdAt, since)),
    db.select({ path: analyticsEvents.path, views: sql<number>`count(*)::int` })
      .from(analyticsEvents)
      .where(and(eq(analyticsEvents.eventName, "page_view"), gte(analyticsEvents.createdAt, since)))
      .groupBy(analyticsEvents.path)
      .orderBy(sql`count(*) desc`)
      .limit(8),
    db.select({
      day: sql<string>`to_char(date_trunc('day', ${analyticsEvents.createdAt}), 'YYYY-MM-DD')`,
      events: sql<number>`count(*)::int`
    }).from(analyticsEvents)
      .where(gte(analyticsEvents.createdAt, since))
      .groupBy(sql`date_trunc('day', ${analyticsEvents.createdAt})`)
      .orderBy(sql`date_trunc('day', ${analyticsEvents.createdAt}) asc`)
  ]);

  return {
    days,
    events: totals?.events ?? 0,
    sessions: totals?.sessions ?? 0,
    users: totals?.users ?? 0,
    pageViews,
    eventsByDay
  };
}
