import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";

test("invitation tokens are signed, deterministic and tamper evident", async () => {
  process.env.BETTER_AUTH_SECRET = "unit-test-invitation-secret-with-at-least-32-characters";
  const { createInvitationToken, hashInvitationToken, verifyInvitationToken } = await import("../src/lib/workspaces/invitations");
  const id = randomUUID();
  const token = createInvitationToken(id);

  assert.equal(createInvitationToken(id), token);
  assert.equal(verifyInvitationToken(token), id);
  assert.equal(hashInvitationToken(token).length, 64);
  assert.equal(verifyInvitationToken(`${token.slice(0, -1)}x`), null);
  assert.equal(verifyInvitationToken(`${randomUUID()}.${token.split(".")[1]}`), null);
  assert.equal(verifyInvitationToken("not-a-token"), null);
});
