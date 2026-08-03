import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";

import type { AuthAccount } from "@/lib/auth/server";
import { getDb } from "@/lib/db/client";
import { auditLogs, users } from "@/lib/db/schema";

export const adminUserUpdateSchema = z
  .object({
    role: z.enum(["user", "admin"]).optional(),
    active: z.boolean().optional()
  })
  .refine((value) => value.role !== undefined || value.active !== undefined, {
    message: "At least one user field is required"
  });

const adminUserQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().trim().max(160).default(""),
  role: z.enum(["all", "user", "admin"]).default("all"),
  status: z.enum(["all", "active", "inactive"]).default("all"),
  sort: z.enum(["newest", "oldest", "email"]).default("newest")
});

export class AdminUserOperationError extends Error {
  constructor(
    message: string,
    readonly code: "NOT_FOUND" | "SELF_PROTECTION" | "LAST_ADMIN",
    readonly status: 404 | 409
  ) {
    super(message);
    this.name = "AdminUserOperationError";
  }
}

function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

export function parseAdminUserQuery(input: URLSearchParams) {
  return adminUserQuerySchema.parse(Object.fromEntries(input));
}

export async function listAdminUsers(query: z.infer<typeof adminUserQuerySchema>) {
  const db = getDb();
  const conditions = [];

  if (query.q) {
    const pattern = `%${escapeLikePattern(query.q)}%`;
    conditions.push(or(ilike(users.email, pattern), ilike(users.name, pattern)));
  }

  if (query.role !== "all") {
    conditions.push(eq(users.role, query.role));
  }

  if (query.status !== "all") {
    conditions.push(eq(users.active, query.status === "active"));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const offset = (query.page - 1) * query.pageSize;
  const orderBy =
    query.sort === "oldest"
      ? [asc(users.createdAt), asc(users.id)]
      : query.sort === "email"
        ? [asc(users.email), asc(users.id)]
        : [desc(users.createdAt), desc(users.id)];

  const [[count], items] = await Promise.all([
    db.select({ total: sql<number>`count(*)::int` }).from(users).where(where),
    db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        imageUrl: users.imageUrl,
        emailVerified: users.emailVerified,
        role: users.role,
        active: users.active,
        createdAt: users.createdAt,
        lastSignInAt: users.lastSignInAt
      })
      .from(users)
      .where(where)
      .orderBy(...orderBy)
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

export async function updateUserByAdmin(
  actor: AuthAccount,
  targetUserId: string,
  input: z.infer<typeof adminUserUpdateSchema>,
  context: { requestId?: string; ipAddress?: string }
) {
  const db = getDb();

  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('baseboilerplate:admin-user-mutation'))`);

    const [target] = await tx
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        active: users.active
      })
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (!target) {
      throw new AdminUserOperationError("User not found", "NOT_FOUND", 404);
    }

    const nextRole = input.role ?? target.role;
    const nextActive = input.active ?? target.active;

    if (target.id === actor.id && (nextRole !== "admin" || !nextActive)) {
      throw new AdminUserOperationError(
        "You cannot remove your own administrative access",
        "SELF_PROTECTION",
        409
      );
    }

    const removesActiveAdmin = target.role === "admin" && target.active && (nextRole !== "admin" || !nextActive);

    if (removesActiveAdmin) {
      const [adminCount] = await tx
        .select({ total: sql<number>`count(*)::int` })
        .from(users)
        .where(and(eq(users.role, "admin"), eq(users.active, true)));

      if ((adminCount?.total ?? 0) <= 1) {
        throw new AdminUserOperationError(
          "The last active administrator cannot be disabled or demoted",
          "LAST_ADMIN",
          409
        );
      }
    }

    if (nextRole === target.role && nextActive === target.active) {
      return { user: target, changed: false };
    }

    const [updated] = await tx
      .update(users)
      .set({
        role: nextRole,
        active: nextActive,
        updatedAt: new Date()
      })
      .where(eq(users.id, target.id))
      .returning({
        id: users.id,
        email: users.email,
        role: users.role,
        active: users.active
      });

    if (!updated) {
      throw new AdminUserOperationError("User not found", "NOT_FOUND", 404);
    }

    await tx.insert(auditLogs).values({
      actorUserId: actor.id,
      action: "user.updated",
      entityType: "user",
      entityId: target.id,
      requestId: context.requestId?.slice(0, 128),
      ipAddress: context.ipAddress?.slice(0, 64),
      metadata: {
        before: { role: target.role, active: target.active },
        after: { role: updated.role, active: updated.active }
      }
    });

    return { user: updated, changed: true };
  });
}
