import assert from "node:assert/strict";
import { test } from "node:test";

import { renderEmailTemplate } from "../src/lib/notifications/templates";

test("workspace invitation template escapes untrusted HTML", () => {
  const rendered = renderEmailTemplate("workspace.invitation", {
    workspaceName: "<script>alert('workspace')</script>",
    inviterName: "A&B <owner@example.test>",
    invitationUrl: "https://example.test/invitations/safe-token"
  });

  assert.match(rendered.subject, /<script>/);
  assert.doesNotMatch(rendered.html, /<script>/);
  assert.match(rendered.html, /&lt;script&gt;/);
  assert.match(rendered.html, /A&amp;B/);
  assert.match(rendered.text, /https:\/\/example\.test\/invitations\/safe-token/);
});

test("notification renderer rejects unknown templates and malformed payloads", () => {
  assert.throws(() => renderEmailTemplate("unknown", {}), /Unknown email template/);
  assert.throws(() => renderEmailTemplate("workspace.invitation", { workspaceName: "Only a name" }));
});
