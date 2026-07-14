import assert from "node:assert/strict";
import { test } from "node:test";

import { analyticsEventInputSchema, normalizeAnalyticsPath } from "../src/lib/analytics/events";

test("analytics paths are normalized to internal paths", () => {
  assert.equal(normalizeAnalyticsPath("/pricing?plan=starter"), "/pricing?plan=starter");
  assert.equal(normalizeAnalyticsPath("https://evil.example/path"), "/");
});

test("analytics events require stable names and internal paths", () => {
  assert.equal(
    analyticsEventInputSchema.safeParse({
      eventName: "checkout_started",
      sessionId: "session-123",
      path: "/checkout",
      properties: {
        provider: "stripe"
      }
    }).success,
    true
  );

  assert.equal(
    analyticsEventInputSchema.safeParse({
      eventName: "bad event",
      sessionId: "session-123",
      path: "/checkout"
    }).success,
    false
  );

  assert.equal(
    analyticsEventInputSchema.safeParse({
      eventName: "page_view",
      sessionId: "session-123",
      path: "https://example.com"
    }).success,
    false
  );

  assert.equal(
    analyticsEventInputSchema.safeParse({
      eventName: "oversized",
      sessionId: "session-123",
      path: "/",
      properties: { payload: "x".repeat(9_000) }
    }).success,
    false
  );
});
