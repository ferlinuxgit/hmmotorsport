import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { z } from "zod";

import type { AuthAccount } from "@/lib/auth/server";
import { getAppEnv, getBetterAuthEnv } from "@/lib/config/env";
import { isFeatureEnabled } from "@/lib/config/runtime";
import { getDb } from "@/lib/db/client";
import { auditLogs, backgroundJobs, notifications, users, workspaceInvitations, workspaceMembers, workspaces } from "@/lib/db/schema";
import { jobInsertValues } from "@/lib/jobs/queue";

export const invitationCreateSchema = z.object({
  email: z.email().max(255).transform((value) => value.toLowerCase()),
  role: z.enum(["admin", "member"]).default("member"),
  expiresInDays: z.number().int().min(1).max(30).default(7)
});

export class InvitationOperationError extends Error {
  constructor(message: string, readonly code: "NOT_FOUND" | "CONFLICT" | "EXPIRED" | "EMAIL_MISMATCH" | "DISABLED", readonly status: 403 | 404 | 409 | 410) {
    super(message);
    this.name = "InvitationOperationError";
  }
}

function signature(id: string) {
  return createHmac("sha256", getBetterAuthEnv().BETTER_AUTH_SECRET).update(`workspace-invitation:${id}`).digest("base64url");
}

export function createInvitationToken(id: string) {
  return `${id}.${signature(id)}`;
}

export function hashInvitationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function verifyInvitationToken(token: string) {
  const [id, provided, extra] = token.split(".");
  if (extra || !z.string().uuid().safeParse(id).success || !provided) return null;
  const expected = signature(id);
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right) ? id : null;
}

export async function createWorkspaceInvitation(
  actor: AuthAccount,
  workspaceId: string,
  input: z.infer<typeof invitationCreateSchema>,
  context: { requestId?: string; clientIp?: string }
) {
  if (!(await isFeatureEnabled("saas.workspace_invitations", { workspaceId, subjectId: actor.id }))) {
    throw new InvitationOperationError("Workspace invitations are disabled", "DISABLED", 403);
  }
  const db = getDb();
  return db.transaction(async (tx) => {
    // Serializes concurrent invitations for the same workspace/email pair.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`${workspaceId}:${input.email}`}, 0))`);
    const [workspace] = await tx.select({ id: workspaces.id, name: workspaces.name }).from(workspaces)
      .where(eq(workspaces.id, workspaceId)).limit(1);
    if (!workspace) throw new InvitationOperationError("Workspace not found", "NOT_FOUND", 404);
    const [existingUser] = await tx.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);
    if (existingUser) {
      const [membership] = await tx.select({ id: workspaceMembers.id }).from(workspaceMembers)
        .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, existingUser.id))).limit(1);
      if (membership) throw new InvitationOperationError("User is already a workspace member", "CONFLICT", 409);
    }
    await tx.update(workspaceInvitations).set({ status: "revoked", updatedAt: new Date() })
      .where(and(eq(workspaceInvitations.workspaceId, workspaceId), eq(workspaceInvitations.email, input.email), eq(workspaceInvitations.status, "pending")));
    const id = randomUUID();
    const token = createInvitationToken(id);
    const [invitation] = await tx.insert(workspaceInvitations).values({
      id, workspaceId, email: input.email, membershipRole: input.role, tokenHash: hashInvitationToken(token),
      invitedBy: actor.id, expiresAt: new Date(Date.now() + input.expiresInDays * 86_400_000)
    }).returning();
    if (!invitation) throw new Error("Could not create invitation");
    const [notification] = await tx.insert(notifications).values({
      channel: "email", recipient: input.email, template: "workspace.invitation", payload: { invitationId: id }
    }).returning({ id: notifications.id });
    if (!notification) throw new Error("Could not create invitation notification");
    await tx.insert(backgroundJobs).values(jobInsertValues({
      type: "notification.email", payload: { notificationId: notification.id }, deduplicationKey: `workspace-invitation:${id}`
    }));
    await tx.insert(auditLogs).values({
      actorUserId: actor.id, workspaceId, action: "workspace.invitation_created", entityType: "workspace_invitation", entityId: id,
      requestId: context.requestId?.slice(0, 128), ipAddress: context.clientIp?.slice(0, 64),
      metadata: { email: input.email, role: input.role, expiresAt: invitation.expiresAt.toISOString() }
    });
    return invitation;
  });
}

export async function resolveInvitationEmailPayload(invitationId: string) {
  const [value] = await getDb().select({
    id: workspaceInvitations.id, workspaceName: workspaces.name, inviterName: users.name,
    inviterEmail: users.email, status: workspaceInvitations.status, expiresAt: workspaceInvitations.expiresAt
  }).from(workspaceInvitations).innerJoin(workspaces, eq(workspaceInvitations.workspaceId, workspaces.id))
    .leftJoin(users, eq(workspaceInvitations.invitedBy, users.id)).where(eq(workspaceInvitations.id, invitationId)).limit(1);
  if (!value || value.status !== "pending" || value.expiresAt <= new Date()) throw new InvitationOperationError("Invitation is no longer active", "EXPIRED", 410);
  return {
    workspaceName: value.workspaceName,
    inviterName: value.inviterName ?? value.inviterEmail ?? "El equipo",
    invitationUrl: new URL(`/invitations/${createInvitationToken(value.id)}`, getAppEnv().APP_URL).toString()
  };
}

export async function getInvitationPreview(token: string) {
  const id = verifyInvitationToken(token);
  if (!id) return null;
  const [invitation] = await getDb().select({ id: workspaceInvitations.id, email: workspaceInvitations.email, role: workspaceInvitations.membershipRole, status: workspaceInvitations.status, expiresAt: workspaceInvitations.expiresAt, workspaceName: workspaces.name })
    .from(workspaceInvitations).innerJoin(workspaces, eq(workspaceInvitations.workspaceId, workspaces.id))
    .where(and(eq(workspaceInvitations.id, id), eq(workspaceInvitations.tokenHash, hashInvitationToken(token)))).limit(1);
  return invitation ?? null;
}

export async function acceptWorkspaceInvitation(account: AuthAccount, token: string) {
  const id = verifyInvitationToken(token);
  if (!id) throw new InvitationOperationError("Invitation not found", "NOT_FOUND", 404);
  return getDb().transaction(async (tx) => {
    const [invitation] = await tx.select().from(workspaceInvitations)
      .where(and(eq(workspaceInvitations.id, id), eq(workspaceInvitations.tokenHash, hashInvitationToken(token))))
      .limit(1).for("update");
    if (!invitation) throw new InvitationOperationError("Invitation not found", "NOT_FOUND", 404);
    if (invitation.status !== "pending") throw new InvitationOperationError("Invitation is no longer active", "CONFLICT", 409);
    if (invitation.expiresAt <= new Date()) {
      throw new InvitationOperationError("Invitation expired", "EXPIRED", 410);
    }
    if (invitation.email !== account.email.toLowerCase()) throw new InvitationOperationError("Invitation belongs to another email", "EMAIL_MISMATCH", 403);
    await tx.insert(workspaceMembers).values({ workspaceId: invitation.workspaceId, userId: account.id, membershipRole: invitation.membershipRole })
      .onConflictDoUpdate({ target: [workspaceMembers.workspaceId, workspaceMembers.userId], set: { membershipRole: invitation.membershipRole } });
    const now = new Date();
    await tx.update(workspaceInvitations).set({ status: "accepted", acceptedBy: account.id, acceptedAt: now, updatedAt: now }).where(eq(workspaceInvitations.id, id));
    await tx.insert(auditLogs).values({ actorUserId: account.id, workspaceId: invitation.workspaceId, action: "workspace.invitation_accepted", entityType: "workspace_invitation", entityId: id, metadata: { email: account.email, role: invitation.membershipRole } });
    return { workspaceId: invitation.workspaceId };
  });
}

export async function listWorkspaceInvitations(workspaceId: string) {
  return getDb().select({ id: workspaceInvitations.id, email: workspaceInvitations.email, role: workspaceInvitations.membershipRole, status: workspaceInvitations.status, expiresAt: workspaceInvitations.expiresAt, createdAt: workspaceInvitations.createdAt })
    .from(workspaceInvitations).where(and(eq(workspaceInvitations.workspaceId, workspaceId), gt(workspaceInvitations.expiresAt, new Date()))).orderBy(desc(workspaceInvitations.createdAt));
}

export async function revokeWorkspaceInvitation(actor: AuthAccount, workspaceId: string, invitationId: string, context: { requestId?: string; clientIp?: string }) {
  return getDb().transaction(async (tx) => {
    const [invitation] = await tx.update(workspaceInvitations).set({ status: "revoked", updatedAt: new Date() })
      .where(and(eq(workspaceInvitations.id, invitationId), eq(workspaceInvitations.workspaceId, workspaceId), eq(workspaceInvitations.status, "pending"))).returning();
    if (!invitation) throw new InvitationOperationError("Pending invitation not found", "NOT_FOUND", 404);
    await tx.insert(auditLogs).values({
      actorUserId: actor.id, workspaceId, action: "workspace.invitation_revoked", entityType: "workspace_invitation", entityId: invitationId,
      requestId: context.requestId?.slice(0, 128), ipAddress: context.clientIp?.slice(0, 64), metadata: { email: invitation.email }
    });
    return invitation;
  });
}
