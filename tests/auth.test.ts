import assert from "node:assert/strict";
import { test } from "node:test";

import { authClient } from "../src/lib/auth/auth-client";
import { resolveSafeRedirect } from "../src/lib/auth/redirects";

test("Better Auth client initializes with the same-origin defaults", () => {
  assert.equal(typeof authClient.signIn.email, "function");
  assert.equal(typeof authClient.signUp.email, "function");
});

test("post-auth redirects only accept internal paths", () => {
  assert.equal(resolveSafeRedirect("/account?tab=security"), "/account?tab=security");
  assert.equal(resolveSafeRedirect("https://evil.example"), "/dashboard");
  assert.equal(resolveSafeRedirect("//evil.example"), "/dashboard");
  assert.equal(resolveSafeRedirect("javascript:alert(1)"), "/dashboard");
  assert.equal(resolveSafeRedirect("/safe\\evil"), "/dashboard");
});
