import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";

import type { AuthAccount } from "@/lib/auth/server";
import { getDb } from "@/lib/db/client";
import { auditLogs, users, workspaceMembers, workspaces } from "@/lib/db/schema";

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain lowercase letters, numbers and single hyphens");

export const adminWorkspaceCreateSchema = z.object({
  name: z.string().trim().min(2).max(255),
  slug: slugSchema,
  ownerEmail: z.email().max(255).transform((value) => value.toLowerCase())
});

export const adminWorkspaceUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(255).optional(),
    slug: slugSchema.optional(),
    active: z.boolean().optional(),
    ownerEmail: z.email().max(255).transform((value) => value.toLowerCase()).optional()
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: "At least one workspace field is required"
  });

export const adminWorkspaceMemberCreateSchema = z.object({
  email: z.email().max(255).transform((value) => value.toLowerCase()),
  role: z.enum(["admin", "member"]).default("member")
});

export const adminWorkspaceMemberUpdateSchema = z.object({
  role: z.enum(["admin", "member"])
});

const adminWorkspaceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().trim().max(160).default(""),
  status: z.enum(["all", "active", "inactive"]).default("all"),
  sort: z.enum(["newest", "oldest", "name"]).default("newest")
});

export class AdminWorkspaceOperationError extends Error {
  constructor(
    message: string,
    readonly code: "NOT_FOUND" | "USER_NOT_FOUND" | "MEMBER_NOT_FOUND" | "OWNER_PROTECTED" | "CONFLICT",
    readonly status: 404 | 409
  ) {
    super(message);
    this.name = "AdminWorkspaceOperationError";
  }
}

type AuditContext = { requestId?: string; ipAddress?: string };

function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

function auditValues(actor: AuthAccount, context: AuditContext, input: {
  action: string;
  workspaceId: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
}) {
  return {
    actorUserId: actor.id,
    workspaceId: input.workspaceId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    requestId: context.requestId?.slice(0, 128),
    ipAddress: context.ipAddress?.slice(0, 64),
    metadata: input.metadata
  };
}

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

export function parseAdminWorkspaceQuery(input: URLSearchParams) {
  return adminWorkspaceQuerySchema.parse(Object.fromEntries(input));
}

export async function listAdminWorkspaces(query: z.infer<typeof adminWorkspaceQuerySchema>) {
  const db = getDb();
  const conditions = [];

  if (query.q) {
    const pattern = `%${escapeLikePattern(query.q)}%`;
    conditions.push(or(ilike(workspaces.name, pattern), ilike(workspaces.slug, pattern), ilike(users.email, pattern)));
  }
  if (query.status !== "all") conditions.push(eq(workspaces.active, query.status === "active"));

  const where = conditions.length ? and(...conditions) : undefined;
  const orderBy = query.sort === "oldest"
    ? [asc(workspaces.createdAt), asc(workspaces.id)]
    : query.sort === "name"
      ? [asc(workspaces.name), asc(workspaces.id)]
      : [desc(workspaces.createdAt), desc(workspaces.id)];
  const offset = (query.page - 1) * query.pageSize;
  const [[count], items] = await Promise.all([
    db.select({ total: sql<number>`count(*)::int` }).from(workspaces).innerJoin(users, eq(workspaces.ownerId, users.id)).where(where),
    db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        slug: workspaces.slug,
        active: workspaces.active,
        ownerId: workspaces.ownerId,
        ownerEmail: users.email,
        createdAt: workspaces.createdAt,
        updatedAt: workspaces.updatedAt,
        members: sql<number>`(select count(*)::int from ${workspaceMembers} where ${workspaceMembers.workspaceId} = ${workspaces.id})`
      })
      .from(workspaces)
      .innerJoin(users, eq(workspaces.ownerId, users.id))
      .where(where)
      .orderBy(...orderBy)
      .limit(query.pageSize)
      .offset(offset)
  ]);
  const total = count?.total ?? 0;
  return {
    items,
    pagination: { page: query.page, pageSize: query.pageSize, total, pages: Math.max(Math.ceil(total / query.pageSize), 1) }
  };
}

export async function getAdminWorkspace(workspaceId: string) {
  const db = getDb();
  const [workspace] = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      slug: workspaces.slug,
      active: workspaces.active,
      ownerId: workspaces.ownerId,
      ownerEmail: users.email,
      createdAt: workspaces.createdAt,
      updatedAt: workspaces.updatedAt
    })
    .from(workspaces)
    .innerJoin(users, eq(workspaces.ownerId, users.id))
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspace) throw new AdminWorkspaceOperationError("Workspace not found", "NOT_FOUND", 404);

  const members = await db
    .select({
      id: workspaceMembers.id,
      userId: workspaceMembers.userId,
      email: users.email,
      name: users.name,
      active: users.active,
      role: workspaceMembers.membershipRole,
      createdAt: workspaceMembers.createdAt
    })
    .from(workspaceMembers)
    .innerJoin(users, eq(workspaceMembers.userId, users.id))
    .where(eq(workspaceMembers.workspaceId, workspaceId))
    .orderBy(asc(users.email));

  return { ...workspace, members };
}

export async function createWorkspaceByAdmin(
  actor: AuthAccount,
  input: z.infer<typeof adminWorkspaceCreateSchema>,
  context: AuditContext
) {
  const db = getDb();
  try {
    return await db.transaction(async (tx) => {
      const [owner] = await tx.select({ id: users.id, email: users.email, active: users.active }).from(users)
        .where(eq(users.email, input.ownerEmail)).limit(1);
      if (!owner || !owner.active) throw new AdminWorkspaceOperationError("Active owner not found", "USER_NOT_FOUND", 404);

      const [workspace] = await tx.insert(workspaces).values({ name: input.name, slug: input.slug, ownerId: owner.id })
        .returning({ id: workspaces.id, name: workspaces.name, slug: workspaces.slug, ownerId: workspaces.ownerId, active: workspaces.active });
      if (!workspace) throw new Error("Could not create workspace");

      await tx.insert(workspaceMembers).values({ workspaceId: workspace.id, userId: owner.id, membershipRole: "owner" });
      await tx.insert(auditLogs).values(auditValues(actor, context, {
        action: "workspace.created", workspaceId: workspace.id, entityType: "workspace", entityId: workspace.id,
        metadata: { name: workspace.name, slug: workspace.slug, ownerId: owner.id }
      }));
      return workspace;
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new AdminWorkspaceOperationError("Workspace slug already exists", "CONFLICT", 409);
    throw error;
  }
}

export async function updateWorkspaceByAdmin(
  actor: AuthAccount,
  workspaceId: string,
  input: z.infer<typeof adminWorkspaceUpdateSchema>,
  context: AuditContext
) {
  const db = getDb();
  try {
    return await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`workspace:${workspaceId}`}))`);
      const [current] = await tx.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
      if (!current) throw new AdminWorkspaceOperationError("Workspace not found", "NOT_FOUND", 404);

      let nextOwnerId = current.ownerId;
      if (input.ownerEmail) {
        const [owner] = await tx.select({ id: users.id, active: users.active }).from(users)
          .where(eq(users.email, input.ownerEmail)).limit(1);
        if (!owner || !owner.active) throw new AdminWorkspaceOperationError("Active owner not found", "USER_NOT_FOUND", 404);
        nextOwnerId = owner.id;
      }

      if (nextOwnerId !== current.ownerId) {
        await tx.insert(workspaceMembers).values({ workspaceId, userId: nextOwnerId, membershipRole: "owner" })
          .onConflictDoUpdate({ target: [workspaceMembers.workspaceId, workspaceMembers.userId], set: { membershipRole: "owner" } });
        await tx.insert(workspaceMembers).values({ workspaceId, userId: current.ownerId, membershipRole: "admin" })
          .onConflictDoUpdate({ target: [workspaceMembers.workspaceId, workspaceMembers.userId], set: { membershipRole: "admin" } });
      }

      const [updated] = await tx.update(workspaces).set({
        name: input.name ?? current.name,
        slug: input.slug ?? current.slug,
        active: input.active ?? current.active,
        ownerId: nextOwnerId,
        updatedAt: new Date()
      }).where(eq(workspaces.id, workspaceId)).returning();
      if (!updated) throw new AdminWorkspaceOperationError("Workspace not found", "NOT_FOUND", 404);

      await tx.insert(auditLogs).values(auditValues(actor, context, {
        action: nextOwnerId !== current.ownerId ? "workspace.ownership_transferred" : "workspace.updated",
        workspaceId, entityType: "workspace", entityId: workspaceId,
        metadata: {
          before: { name: current.name, slug: current.slug, active: current.active, ownerId: current.ownerId },
          after: { name: updated.name, slug: updated.slug, active: updated.active, ownerId: updated.ownerId }
        }
      }));
      return updated;
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new AdminWorkspaceOperationError("Workspace slug already exists", "CONFLICT", 409);
    throw error;
  }
}

export async function addWorkspaceMemberByAdmin(
  actor: AuthAccount,
  workspaceId: string,
  input: z.infer<typeof adminWorkspaceMemberCreateSchema>,
  context: AuditContext
) {
  const db = getDb();
  try {
    return await db.transaction(async (tx) => {
      const [workspace] = await tx.select({ id: workspaces.id }).from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
      if (!workspace) throw new AdminWorkspaceOperationError("Workspace not found", "NOT_FOUND", 404);
      const [user] = await tx.select({ id: users.id, email: users.email, active: users.active }).from(users)
        .where(eq(users.email, input.email)).limit(1);
      if (!user || !user.active) throw new AdminWorkspaceOperationError("Active user not found", "USER_NOT_FOUND", 404);

      const [member] = await tx.insert(workspaceMembers).values({ workspaceId, userId: user.id, membershipRole: input.role })
        .returning({ id: workspaceMembers.id, userId: workspaceMembers.userId, role: workspaceMembers.membershipRole });
      if (!member) throw new Error("Could not add workspace member");
      await tx.insert(auditLogs).values(auditValues(actor, context, {
        action: "workspace.member_added", workspaceId, entityType: "workspace_member", entityId: `${workspaceId}:${user.id}`,
        metadata: { userId: user.id, email: user.email, role: member.role }
      }));
      return member;
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new AdminWorkspaceOperationError("User is already a workspace member", "CONFLICT", 409);
    throw error;
  }
}

export async function updateWorkspaceMemberByAdmin(
  actor: AuthAccount,
  workspaceId: string,
  userId: string,
  input: z.infer<typeof adminWorkspaceMemberUpdateSchema>,
  context: AuditContext
) {
  const db = getDb();
  return db.transaction(async (tx) => {
    const [workspace] = await tx.select({ ownerId: workspaces.ownerId }).from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
    if (!workspace) throw new AdminWorkspaceOperationError("Workspace not found", "NOT_FOUND", 404);
    if (workspace.ownerId === userId) throw new AdminWorkspaceOperationError("Workspace owner role is protected", "OWNER_PROTECTED", 409);
    const [current] = await tx.select({ role: workspaceMembers.membershipRole }).from(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId))).limit(1);
    if (!current) throw new AdminWorkspaceOperationError("Workspace member not found", "MEMBER_NOT_FOUND", 404);
    const [updated] = await tx.update(workspaceMembers).set({ membershipRole: input.role })
      .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)))
      .returning({ userId: workspaceMembers.userId, role: workspaceMembers.membershipRole });
    if (!updated) throw new AdminWorkspaceOperationError("Workspace member not found", "MEMBER_NOT_FOUND", 404);
    await tx.insert(auditLogs).values(auditValues(actor, context, {
      action: "workspace.member_updated", workspaceId, entityType: "workspace_member", entityId: `${workspaceId}:${userId}`,
      metadata: { userId, before: { role: current.role }, after: { role: updated.role } }
    }));
    return updated;
  });
}

export async function removeWorkspaceMemberByAdmin(
  actor: AuthAccount,
  workspaceId: string,
  userId: string,
  context: AuditContext
) {
  const db = getDb();
  return db.transaction(async (tx) => {
    const [workspace] = await tx.select({ ownerId: workspaces.ownerId }).from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
    if (!workspace) throw new AdminWorkspaceOperationError("Workspace not found", "NOT_FOUND", 404);
    if (workspace.ownerId === userId) throw new AdminWorkspaceOperationError("Workspace owner cannot be removed", "OWNER_PROTECTED", 409);
    const [removed] = await tx.delete(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)))
      .returning({ userId: workspaceMembers.userId, role: workspaceMembers.membershipRole });
    if (!removed) throw new AdminWorkspaceOperationError("Workspace member not found", "MEMBER_NOT_FOUND", 404);
    await tx.insert(auditLogs).values(auditValues(actor, context, {
      action: "workspace.member_removed", workspaceId, entityType: "workspace_member", entityId: `${workspaceId}:${userId}`,
      metadata: { userId, role: removed.role }
    }));
    return removed;
  });
}
