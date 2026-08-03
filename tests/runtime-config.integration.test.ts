import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";

test("runtime configuration versions, overrides and audits every mutation", { skip: !process.env.TEST_DATABASE_URL }, async () => {
  process.env.DATABASE_MODE = "external";
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.RATE_LIMIT_BACKEND = "database";
  const [{ eq }, { closeDb, getDb }, schema, runtime] = await Promise.all([
    import("drizzle-orm"), import("../src/lib/db/client"), import("../src/lib/db/schema"), import("../src/lib/config/runtime")
  ]);
  const db = getDb();
  const actorId = randomUUID();
  const workspaceId = randomUUID();
  const actor = { id: actorId, email: `${actorId}@example.test`, name: "Admin", imageUrl: null, role: "admin" as const, emailVerified: true, active: true };
  try {
    await db.insert(schema.users).values({ id: actorId, email: actor.email, role: "admin" });
    await db.insert(schema.workspaces).values({ id: workspaceId, slug: `config-${workspaceId}`, name: "Config workspace", ownerId: actorId });
    await db.insert(schema.workspaceMembers).values({ workspaceId, userId: actorId, membershipRole: "owner" });
    const setting = await runtime.updateRuntimeSetting(actor, "app.support_email", { value: "help@example.test", expectedVersion: 0 }, { requestId: "req_config" });
    assert.equal(setting.version, 1);
    assert.equal(await runtime.getRuntimeSetting("app.support_email"), "help@example.test");
    await assert.rejects(() => runtime.updateRuntimeSetting(actor, "app.support_email", { value: "stale@example.test", expectedVersion: 0 }, {}), /changed since/i);
    const flag = await runtime.updateFeatureFlag(actor, "saas.workspace_invitations", { enabled: true, rolloutPercentage: 100, expectedVersion: 0 }, {});
    assert.equal(flag.version, 1);
    assert.equal(await runtime.isFeatureEnabled("saas.workspace_invitations", { workspaceId, subjectId: actorId }), true);
    await runtime.setWorkspaceFeatureFlagOverride(actor, "saas.workspace_invitations", workspaceId, false, {});
    assert.equal(await runtime.isFeatureEnabled("saas.workspace_invitations", { workspaceId, subjectId: actorId }), false);
    await runtime.removeWorkspaceFeatureFlagOverride(actor, "saas.workspace_invitations", workspaceId, {});
    assert.equal(await runtime.isFeatureEnabled("saas.workspace_invitations", { workspaceId, subjectId: actorId }), true);
    const audits = await db.select().from(schema.auditLogs).where(eq(schema.auditLogs.actorUserId, actorId));
    assert.deepEqual(audits.map((item) => item.action).sort(), ["configuration.flag_override_removed", "configuration.flag_override_set", "configuration.flag_updated", "configuration.setting_updated"]);
  } finally {
    await db.delete(schema.auditLogs).where(eq(schema.auditLogs.actorUserId, actorId));
    await db.delete(schema.workspaceFeatureFlagOverrides).where(eq(schema.workspaceFeatureFlagOverrides.workspaceId, workspaceId));
    await db.delete(schema.featureFlags).where(eq(schema.featureFlags.key, "saas.workspace_invitations"));
    await db.delete(schema.runtimeSettings).where(eq(schema.runtimeSettings.key, "app.support_email"));
    await db.delete(schema.workspaces).where(eq(schema.workspaces.id, workspaceId));
    await db.delete(schema.users).where(eq(schema.users.id, actorId));
    await closeDb();
  }
});
