import { and, eq } from "drizzle-orm";

import { isAdminRole } from "@/lib/auth/constants";
import { getCurrentAccount, type AuthAccount } from "@/lib/auth/server";
import { getDb } from "@/lib/db/client";
import { workspaceMembers, workspaces } from "@/lib/db/schema";

export type WorkspaceRole = "owner" | "admin" | "member";

const workspaceRoleRank: Record<WorkspaceRole, number> = {
  member: 1,
  admin: 2,
  owner: 3
};

export async function requireAccount(): Promise<AuthAccount> {
  const account = await getCurrentAccount();

  if (!account) {
    throw new Error("Unauthorized");
  }

  return account;
}

export async function requireAdminAccount() {
  const account = await requireAccount();

  if (!isAdminRole(account.role)) {
    throw new Error("Forbidden");
  }

  return account;
}

export async function hasWorkspaceRole(account: AuthAccount, workspaceId: string, minimumRole: WorkspaceRole = "member") {
  if (isAdminRole(account.role)) {
    return true;
  }

  const db = getDb();
  const [membership] = await db
    .select({
      ownerId: workspaces.ownerId,
      membershipRole: workspaceMembers.membershipRole
    })
    .from(workspaces)
    .leftJoin(
      workspaceMembers,
      and(eq(workspaceMembers.workspaceId, workspaces.id), eq(workspaceMembers.userId, account.id))
    )
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!membership) {
    return false;
  }

  const role = membership.ownerId === account.id ? "owner" : normalizeWorkspaceRole(membership.membershipRole);
  return workspaceRoleRank[role] >= workspaceRoleRank[minimumRole];
}

function normalizeWorkspaceRole(role: string | null): WorkspaceRole {
  if (role === "owner" || role === "admin" || role === "member") {
    return role;
  }

  return "member";
}
