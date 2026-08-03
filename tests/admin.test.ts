import assert from "node:assert/strict";
import { test } from "node:test";

import { parseAuditLogQuery } from "../src/lib/admin/audit";
import { adminUserUpdateSchema, parseAdminUserQuery } from "../src/lib/admin/users";
import {
  adminWorkspaceCreateSchema,
  adminWorkspaceMemberCreateSchema,
  adminWorkspaceUpdateSchema,
  parseAdminWorkspaceQuery
} from "../src/lib/admin/workspaces";
import { getBackofficeNavigation } from "../src/lib/modules/loader";
import { enqueueJobSchema, parseJobQuery } from "../src/lib/jobs/queue";

test("admin user queries have bounded pagination and explicit filters", () => {
  assert.deepEqual(parseAdminUserQuery(new URLSearchParams()), {
    page: 1,
    pageSize: 25,
    q: "",
    role: "all",
    status: "all",
    sort: "newest"
  });

  assert.equal(
    parseAdminUserQuery(new URLSearchParams("page=2&pageSize=100&role=admin&status=active")).pageSize,
    100
  );
  assert.throws(() => parseAdminUserQuery(new URLSearchParams("pageSize=101")));
  assert.throws(() => parseAdminUserQuery(new URLSearchParams("role=owner")));
});

test("admin user mutations accept only supported, non-empty changes", () => {
  assert.equal(adminUserUpdateSchema.safeParse({ role: "admin" }).success, true);
  assert.equal(adminUserUpdateSchema.safeParse({ active: false }).success, true);
  assert.equal(adminUserUpdateSchema.safeParse({}).success, false);
  assert.equal(adminUserUpdateSchema.safeParse({ role: "superadmin" }).success, false);
  assert.equal(adminUserUpdateSchema.safeParse({ active: "false" }).success, false);
});

test("audit queries are bounded", () => {
  assert.equal(parseAuditLogQuery(new URLSearchParams()).pageSize, 25);
  assert.throws(() => parseAuditLogQuery(new URLSearchParams("page=0")));
  assert.throws(() => parseAuditLogQuery(new URLSearchParams("pageSize=1000")));
});

test("installed modules register unique backoffice destinations", () => {
  const navigation = getBackofficeNavigation();
  assert.equal(navigation.length >= 3, true);
  assert.equal(new Set(navigation.map((item) => item.key)).size, navigation.length);
  assert.equal(navigation.every((item) => item.href.startsWith("/admin")), true);
});

test("workspace administration validates slugs, owners and bounded queries", () => {
  assert.equal(adminWorkspaceCreateSchema.safeParse({ name: "Acme", slug: "acme-eu", ownerEmail: "OWNER@EXAMPLE.COM" }).success, true);
  assert.equal(adminWorkspaceCreateSchema.safeParse({ name: "Acme", slug: "Acme EU", ownerEmail: "owner@example.com" }).success, false);
  assert.equal(adminWorkspaceUpdateSchema.safeParse({}).success, false);
  assert.equal(adminWorkspaceUpdateSchema.safeParse({ active: false }).success, true);
  assert.equal(adminWorkspaceMemberCreateSchema.safeParse({ email: "member@example.com", role: "owner" }).success, false);
  assert.deepEqual(parseAdminWorkspaceQuery(new URLSearchParams()), {
    page: 1, pageSize: 25, q: "", status: "all", sort: "newest"
  });
  assert.throws(() => parseAdminWorkspaceQuery(new URLSearchParams("pageSize=101")));
});

test("background job inputs and operational queries are bounded", () => {
  assert.equal(enqueueJobSchema.safeParse({ type: "notification.email", payload: {}, maxAttempts: 5 }).success, true);
  assert.equal(enqueueJobSchema.safeParse({ type: "Bad Type", payload: {} }).success, false);
  assert.equal(enqueueJobSchema.safeParse({ type: "system.noop", payload: {}, maxAttempts: 26 }).success, false);
  assert.equal(parseJobQuery(new URLSearchParams()).status, "all");
  assert.throws(() => parseJobQuery(new URLSearchParams("status=unknown")));
});
