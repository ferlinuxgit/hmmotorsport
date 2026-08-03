import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";

import {
  createRequestId,
  getSecurityHeaders,
  isSameOriginRequest,
  readBinaryBody,
  readJsonBody,
  resolveRequestId
} from "../src/lib/observability/http";
import { getOverallHealthState } from "../src/lib/observability/health";
import { checkRateLimit, getClientIp } from "../src/lib/observability/rate-limit";

test("request ids are generated and preserved", () => {
  const generated = createRequestId();
  assert.equal(typeof generated, "string");
  assert.equal(generated.length > 10, true);

  const resolved = resolveRequestId({
    "x-request-id": "req_test_123"
  });

  assert.equal(resolved, "req_test_123");
});

test("security headers include production-only hsts", () => {
  const commonHeaders = getSecurityHeaders();
  assert.equal(commonHeaders["X-Frame-Options"], "DENY");
  assert.match(commonHeaders["Content-Security-Policy"], /object-src 'none'/);
  assert.equal(commonHeaders["Strict-Transport-Security"], undefined);

  const productionHeaders = getSecurityHeaders({ isProduction: true });
  assert.equal(productionHeaders["Strict-Transport-Security"], "max-age=31536000; includeSubDomains; preload");
});

test("overall health prioritizes error over degraded", () => {
  assert.equal(getOverallHealthState({ app: "ok", configuration: "ok", database: "ok", payments: "ok" }), "ok");
  assert.equal(getOverallHealthState({ app: "ok", configuration: "ok", database: "ok", payments: "degraded" }), "degraded");
  assert.equal(getOverallHealthState({ app: "ok", configuration: "ok", database: "error", payments: "degraded" }), "error");
});

test("rate limit blocks requests above the configured window", () => {
  const key = `test:${randomUUID()}`;

  assert.equal(checkRateLimit({ key, limit: 2, windowMs: 1_000, now: 0 }).allowed, true);
  assert.equal(checkRateLimit({ key, limit: 2, windowMs: 1_000, now: 1 }).allowed, true);
  assert.equal(checkRateLimit({ key, limit: 2, windowMs: 1_000, now: 2 }).allowed, false);
  assert.equal(checkRateLimit({ key, limit: 2, windowMs: 1_000, now: 1_001 }).allowed, true);
});

test("client ip resolves proxy headers in priority order", () => {
  assert.equal(getClientIp(new Headers({ "cf-connecting-ip": "203.0.113.1" }), { trustProxyHeaders: true }), "203.0.113.1");
  assert.equal(
    getClientIp(new Headers({ "x-forwarded-for": "203.0.113.2, 10.0.0.1" }), { trustProxyHeaders: true }),
    "203.0.113.2"
  );
  assert.equal(getClientIp(new Headers({ "x-forwarded-for": "203.0.113.2" }), { trustProxyHeaders: false }), "untrusted-proxy");
});

test("JSON request bodies enforce a byte limit before parsing", async () => {
  const request = new Request("https://example.com", { method: "POST", body: JSON.stringify({ value: "ok" }) });
  assert.deepEqual(await readJsonBody(request, 100), { value: "ok" });

  const oversized = new Request("https://example.com", { method: "POST", body: JSON.stringify({ value: "x".repeat(100) }) });
  await assert.rejects(() => readJsonBody(oversized, 20), /too large/);
});

test("binary request bodies are assembled and bounded", async () => {
  const request = new Request("https://example.test/upload", { method: "PUT", body: new Uint8Array([1, 2, 3, 4]) });
  assert.deepEqual([...await readBinaryBody(request, 4)], [1, 2, 3, 4]);
  const oversized = new Request("https://example.test/upload", { method: "PUT", body: new Uint8Array([1, 2, 3]) });
  await assert.rejects(() => readBinaryBody(oversized, 2), /too large/i);
});

test("state-changing requests require an allowed origin", () => {
  assert.equal(
    isSameOriginRequest(
      new Request("https://app.example.com/api/admin/users/1", {
        method: "PATCH",
        headers: { origin: "https://app.example.com" }
      })
    ),
    true
  );
  assert.equal(
    isSameOriginRequest(
      new Request("http://internal:3000/api/admin/users/1", {
        method: "PATCH",
        headers: { origin: "https://app.example.com" }
      }),
      ["https://app.example.com"]
    ),
    true
  );
  assert.equal(
    isSameOriginRequest(
      new Request("https://app.example.com/api/admin/users/1", {
        method: "PATCH",
        headers: { origin: "https://evil.example" }
      })
    ),
    false
  );
  assert.equal(isSameOriginRequest(new Request("https://app.example.com/api/admin/users/1", { method: "PATCH" })), false);
});
