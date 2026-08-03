import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";

test("workspace invitations enqueue, deliver, enforce identity and accept atomically", { skip: !process.env.TEST_DATABASE_URL }, async () => {
  process.env.DATABASE_MODE = "external";
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.RATE_LIMIT_BACKEND = "database";
  process.env.BETTER_AUTH_SECRET = "integration-invitation-secret-with-at-least-32-characters";
  process.env.APP_URL = "https://app.example.test";
  process.env.EMAIL_PROVIDER = "console";
  process.env.EMAIL_FROM = "noreply@example.test";

  const [{ eq }, { closeDb, getDb }, schema, invitations, { runJobBatch }] = await Promise.all([
    import("drizzle-orm"),
    import("../src/lib/db/client"),
    import("../src/lib/db/schema"),
    import("../src/lib/workspaces/invitations"),
    import("../src/lib/jobs/runner")
  ]);
  const db = getDb();
  const actorId = randomUUID();
  const inviteeId = randomUUID();
  const workspaceId = randomUUID();
  const inviteeEmail = `${inviteeId}@example.test`;
  const actor = { id: actorId, email: `${actorId}@example.test`, name: "Admin", imageUrl: null, role: "admin" as const, emailVerified: true, active: true };
  const invitee = { id: inviteeId, email: inviteeEmail, name: "Invitee", imageUrl: null, role: "user" as const, emailVerified: true, active: true };
  let invitationId: string | undefined;
  let notificationId: string | undefined;
  let jobId: string | undefined;

  try {
    await db.insert(schema.users).values([
      { id: actorId, email: actor.email, name: actor.name, role: "admin" },
      { id: inviteeId, email: invitee.email, name: invitee.name }
    ]);
    await db.insert(schema.workspaces).values({ id: workspaceId, slug: `invite-${workspaceId}`, name: "Invitations workspace", ownerId: actorId });
    await db.insert(schema.workspaceMembers).values({ workspaceId, userId: actorId, membershipRole: "owner" });

    const created = await invitations.createWorkspaceInvitation(actor, workspaceId, { email: inviteeEmail, role: "admin", expiresInDays: 7 }, { requestId: "req_invite", clientIp: "127.0.0.1" });
    invitationId = created.id;
    const [notification] = await db.select().from(schema.notifications).where(eq(schema.notifications.recipient, inviteeEmail));
    assert.ok(notification);
    notificationId = notification.id;
    assert.deepEqual(notification.payload, { invitationId });
    const [job] = await db.select().from(schema.backgroundJobs).where(eq(schema.backgroundJobs.deduplicationKey, `workspace-invitation:${invitationId}`));
    assert.ok(job);
    jobId = job.id;

    await runJobBatch({ workerId: `invitation-test-${workspaceId}`, batchSize: 100 });
    const [delivered] = await db.select().from(schema.notifications).where(eq(schema.notifications.id, notificationId));
    assert.equal(delivered.status, "sent");
    assert.equal(delivered.provider, "console");

    const token = invitations.createInvitationToken(invitationId);
    await assert.rejects(
      () => invitations.acceptWorkspaceInvitation({ ...invitee, email: "another@example.test" }, token),
      (error: unknown) => error instanceof invitations.InvitationOperationError && error.code === "EMAIL_MISMATCH"
    );
    const accepted = await invitations.acceptWorkspaceInvitation(invitee, token);
    assert.equal(accepted.workspaceId, workspaceId);
    const [membership] = await db.select().from(schema.workspaceMembers).where(eq(schema.workspaceMembers.userId, inviteeId));
    assert.equal(membership.membershipRole, "admin");
    const [persisted] = await db.select().from(schema.workspaceInvitations).where(eq(schema.workspaceInvitations.id, invitationId));
    assert.equal(persisted.status, "accepted");
    assert.equal(persisted.acceptedBy, inviteeId);
    await assert.rejects(() => invitations.acceptWorkspaceInvitation(invitee, token), /no longer active/i);
    const auditEvents = await db.select().from(schema.auditLogs).where(eq(schema.auditLogs.entityId, invitationId));
    assert.deepEqual(auditEvents.map((entry) => entry.action).sort(), ["workspace.invitation_accepted", "workspace.invitation_created"]);
  } finally {
    await db.delete(schema.auditLogs).where(eq(schema.auditLogs.workspaceId, workspaceId));
    if (jobId) await db.delete(schema.backgroundJobs).where(eq(schema.backgroundJobs.id, jobId));
    if (notificationId) await db.delete(schema.notifications).where(eq(schema.notifications.id, notificationId));
    if (invitationId) await db.delete(schema.workspaceInvitations).where(eq(schema.workspaceInvitations.id, invitationId));
    await db.delete(schema.workspaces).where(eq(schema.workspaces.id, workspaceId));
    await db.delete(schema.users).where(eq(schema.users.id, inviteeId));
    await db.delete(schema.users).where(eq(schema.users.id, actorId));
    await closeDb();
  }
});
