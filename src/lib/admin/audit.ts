import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/lib/db/client";
import { auditLogs, users } from "@/lib/db/schema";

const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().trim().max(160).default(""),
  action: z.string().trim().max(160).default("")
});

function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

export function parseAuditLogQuery(input: URLSearchParams) {
  return auditLogQuerySchema.parse(Object.fromEntries(input));
}

export async function listAuditLogs(query: z.infer<typeof auditLogQuerySchema>) {
  const db = getDb();
  const conditions = [];

  if (query.q) {
    const pattern = `%${escapeLikePattern(query.q)}%`;
    conditions.push(
      or(
        ilike(auditLogs.action, pattern),
        ilike(auditLogs.entityType, pattern),
        ilike(auditLogs.entityId, pattern),
        ilike(users.email, pattern)
      )
    );
  }

  if (query.action) {
    conditions.push(eq(auditLogs.action, query.action));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const offset = (query.page - 1) * query.pageSize;
  const [[count], items] = await Promise.all([
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorUserId, users.id))
      .where(where),
    db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        requestId: auditLogs.requestId,
        ipAddress: auditLogs.ipAddress,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
        actorUserId: auditLogs.actorUserId,
        actorEmail: users.email
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorUserId, users.id))
      .where(where)
      .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
      .limit(query.pageSize)
      .offset(offset)
  ]);

  const total = count?.total ?? 0;
  return {
    items,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      pages: Math.max(Math.ceil(total / query.pageSize), 1)
    }
  };
}
