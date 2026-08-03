import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";

test("workspace ownership and membership mutations are atomic and audited", { skip: !process.env.TEST_DATABASE_URL }, async () => {
  process.env.DATABASE_MODE = "external";
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.RATE_LIMIT_BACKEND = "database";

  const [{ eq, or }, { closeDb, getDb }, schema, workspacesAdmin] = await Promise.all([
    import("drizzle-orm"),
    import("../src/lib/db/client"),
    import("../src/lib/db/schema"),
    import("../src/lib/admin/workspaces")
  ]);
  const db = getDb();
  const adminId = randomUUID();
  const ownerId = randomUUID();
  const memberId = randomUUID();
  const slug = `workspace-${randomUUID()}`;
  let workspaceId: string | undefined;

  try {
    await db.insert(schema.users).values([
      { id: adminId, email: `${adminId}@example.test`, name: "Admin", role: "admin" },
      { id: ownerId, email: `${ownerId}@example.test`, name: "Owner" },
      { id: memberId, email: `${memberId}@example.test`, name: "Member" }
    ]);
    const actor = {
      id: adminId, email: `${adminId}@example.test`, name: "Admin", imageUrl: null,
      role: "admin" as const, emailVerified: true, active: true
    };
    const created = await workspacesAdmin.createWorkspaceByAdmin(actor, {
      name: "Integration workspace", slug, ownerEmail: `${ownerId}@example.test`
    }, { requestId: "req_workspace_test", ipAddress: "127.0.0.1" });
    workspaceId = created.id;
    await assert.rejects(() => db.delete(schema.users).where(eq(schema.users.id, ownerId)));

    await workspacesAdmin.addWorkspaceMemberByAdmin(actor, workspaceId, {
      email: `${memberId}@example.test`, role: "member"
    }, {});
    await workspacesAdmin.updateWorkspaceMemberByAdmin(actor, workspaceId, memberId, { role: "admin" }, {});
    await workspacesAdmin.updateWorkspaceByAdmin(actor, workspaceId, { ownerEmail: `${memberId}@example.test` }, {});

    const detail = await workspacesAdmin.getAdminWorkspace(workspaceId);
    assert.equal(detail.ownerId, memberId);
    assert.equal(detail.members.find((item) => item.userId === memberId)?.role, "owner");
    assert.equal(detail.members.find((item) => item.userId === ownerId)?.role, "admin");
    await assert.rejects(
      () => workspacesAdmin.removeWorkspaceMemberByAdmin(actor, workspaceId!, memberId, {}),
      /owner cannot be removed/i
    );
    await workspacesAdmin.removeWorkspaceMemberByAdmin(actor, workspaceId, ownerId, {});
    await workspacesAdmin.updateWorkspaceByAdmin(actor, workspaceId, { active: false }, {});

    const [persisted] = await db.select({ active: schema.workspaces.active }).from(schema.workspaces)
      .where(eq(schema.workspaces.id, workspaceId));
    const events = await db.select({ action: schema.auditLogs.action }).from(schema.auditLogs)
      .where(eq(schema.auditLogs.workspaceId, workspaceId));
    assert.equal(persisted.active, false);
    assert.equal(events.some((item) => item.action === "workspace.created"), true);
    assert.equal(events.some((item) => item.action === "workspace.ownership_transferred"), true);
    assert.equal(events.some((item) => item.action === "workspace.member_removed"), true);
  } finally {
    if (workspaceId) {
      await db.delete(schema.auditLogs).where(eq(schema.auditLogs.workspaceId, workspaceId));
      await db.delete(schema.workspaces).where(eq(schema.workspaces.id, workspaceId));
    }
    await db.delete(schema.users).where(or(
      eq(schema.users.id, adminId), eq(schema.users.id, ownerId), eq(schema.users.id, memberId)
    ));
    await closeDb();
  }
});
