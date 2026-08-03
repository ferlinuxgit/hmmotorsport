import { eq, or } from "drizzle-orm";

import type { AuthAccount } from "@/lib/auth/server";
import { getDb } from "@/lib/db/client";
import { entitlements, fileAssets, orders, users, workspaceInvitations, workspaceMembers, workspaces } from "@/lib/db/schema";

export async function exportAccountData(account: AuthAccount) {
  const db = getDb();
  const [profile, memberships, ownedWorkspaces, orderItems, entitlementItems, fileItems, invitations] = await Promise.all([
    db.select({ id: users.id, email: users.email, name: users.name, imageUrl: users.imageUrl, emailVerified: users.emailVerified, role: users.role, active: users.active, createdAt: users.createdAt, updatedAt: users.updatedAt }).from(users).where(eq(users.id, account.id)).limit(1),
    db.select({ workspaceId: workspaceMembers.workspaceId, workspaceName: workspaces.name, workspaceSlug: workspaces.slug, role: workspaceMembers.membershipRole, joinedAt: workspaceMembers.createdAt }).from(workspaceMembers).innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id)).where(eq(workspaceMembers.userId, account.id)),
    db.select({ id: workspaces.id, name: workspaces.name, slug: workspaces.slug, active: workspaces.active, createdAt: workspaces.createdAt }).from(workspaces).where(eq(workspaces.ownerId, account.id)),
    db.select({ id: orders.id, workspaceId: orders.workspaceId, provider: orders.provider, status: orders.status, total: orders.total, currency: orders.currency, createdAt: orders.createdAt, updatedAt: orders.updatedAt }).from(orders).where(eq(orders.userId, account.id)),
    db.select({ id: entitlements.id, key: entitlements.key, workspaceId: entitlements.workspaceId, status: entitlements.status, startsAt: entitlements.startsAt, expiresAt: entitlements.expiresAt }).from(entitlements).where(eq(entitlements.userId, account.id)),
    db.select({ id: fileAssets.id, workspaceId: fileAssets.workspaceId, originalName: fileAssets.originalName, mimeType: fileAssets.mimeType, sizeBytes: fileAssets.sizeBytes, status: fileAssets.status, createdAt: fileAssets.createdAt }).from(fileAssets).where(eq(fileAssets.uploadedBy, account.id)),
    db.select({ id: workspaceInvitations.id, workspaceId: workspaceInvitations.workspaceId, email: workspaceInvitations.email, role: workspaceInvitations.membershipRole, status: workspaceInvitations.status, expiresAt: workspaceInvitations.expiresAt, createdAt: workspaceInvitations.createdAt }).from(workspaceInvitations).where(or(eq(workspaceInvitations.acceptedBy, account.id), eq(workspaceInvitations.email, account.email.toLowerCase())))
  ]);
  return { exportedAt: new Date().toISOString(), profile: profile[0] ?? account, memberships, ownedWorkspaces, orders: orderItems, entitlements: entitlementItems, files: fileItems, invitations };
}
