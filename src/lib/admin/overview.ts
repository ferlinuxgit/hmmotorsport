import { desc, eq, sql } from "drizzle-orm";

import { getProductionReadinessIssues } from "@/lib/config/env";
import { getDb } from "@/lib/db/client";
import { orders, prices, products, sessions, users, workspaceMembers, workspaces } from "@/lib/db/schema";
import { getAnalyticsSummary, listRecentAnalyticsEvents } from "@/lib/analytics/events";
import { getEnabledPaymentProviders, getInstalledModules } from "@/lib/modules/loader";

export async function getAdminOverview() {
  const db = getDb();
  const modules = getInstalledModules();
  const enabledPaymentProviders = getEnabledPaymentProviders();
  const [
    analytics,
    recentAnalyticsEvents,
    [userStats],
    [workspaceStats],
    [membershipStats],
    [productStats],
    [priceStats],
    [orderStats],
    revenueByCurrency,
    [sessionStats],
    orderStatus,
    recentOrders,
    recentUsers
  ] = await Promise.all([
    getAnalyticsSummary(14),
    listRecentAnalyticsEvents(12),
    db.select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where ${users.active} = true)::int`,
      admins: sql<number>`count(*) filter (where ${users.role} = 'admin')::int`,
      verified: sql<number>`count(*) filter (where ${users.emailVerified} = true)::int`
    }).from(users),
    db.select({ total: sql<number>`count(*)::int` }).from(workspaces),
    db.select({ total: sql<number>`count(*)::int` }).from(workspaceMembers),
    db.select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where ${products.active} = true)::int`
    }).from(products),
    db.select({ total: sql<number>`count(*)::int` }).from(prices),
    db.select({
      total: sql<number>`count(*)::int`,
      paid: sql<number>`count(*) filter (where ${orders.status} = 'paid')::int`,
      pending: sql<number>`count(*) filter (where ${orders.status} in ('draft', 'checkout_pending'))::int`,
      failed: sql<number>`count(*) filter (where ${orders.status} in ('failed', 'cancelled'))::int`
    }).from(orders),
    db.select({
      currency: orders.currency,
      revenue: sql<string>`coalesce(sum(${orders.total}), 0)::text`
    }).from(orders).where(eq(orders.status, "paid")).groupBy(orders.currency).orderBy(orders.currency),
    db.select({
      active: sql<number>`count(*) filter (where ${sessions.expiresAt} > now())::int`,
      total: sql<number>`count(*)::int`
    }).from(sessions),
    db.select({ status: orders.status, count: sql<number>`count(*)::int` })
      .from(orders).groupBy(orders.status).orderBy(sql`count(*) desc`),
    db.select({
      id: orders.id,
      provider: orders.provider,
      status: orders.status,
      total: orders.total,
      currency: orders.currency,
      createdAt: orders.createdAt,
      userEmail: users.email
    }).from(orders).leftJoin(users, eq(orders.userId, users.id)).orderBy(desc(orders.createdAt)).limit(12),
    db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      imageUrl: users.imageUrl,
      emailVerified: users.emailVerified,
      role: users.role,
      active: users.active,
      createdAt: users.createdAt,
      lastSignInAt: users.lastSignInAt
    }).from(users).orderBy(desc(users.createdAt)).limit(12)
  ]);

  return {
    configurationIssues: getProductionReadinessIssues(process.env, { requiredPaymentProviders: enabledPaymentProviders }),
    modules,
    enabledPaymentProviders,
    users: userStats ?? { total: 0, active: 0, admins: 0, verified: 0 },
    workspaces: {
      total: workspaceStats?.total ?? 0,
      memberships: membershipStats?.total ?? 0
    },
    products: {
      total: productStats?.total ?? 0,
      active: productStats?.active ?? 0,
      prices: priceStats?.total ?? 0
    },
    orders: {
      ...(orderStats ?? { total: 0, paid: 0, pending: 0, failed: 0 }),
      revenueByCurrency
    },
    sessions: sessionStats ?? { active: 0, total: 0 },
    orderStatus,
    recentOrders,
    recentUsers,
    analytics,
    recentAnalyticsEvents
  };
}

export type AdminOverview = Awaited<ReturnType<typeof getAdminOverview>>;
