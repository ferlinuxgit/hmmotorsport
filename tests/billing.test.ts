import assert from "node:assert/strict";
import { test } from "node:test";

import { refundRequestSchema } from "../src/lib/billing/service";

test("refund requests require a positive decimal candidate and meaningful reason", () => {
  assert.equal(refundRequestSchema.safeParse({ amount: "19.00", reason: "Customer request" }).success, true);
  assert.equal(refundRequestSchema.safeParse({ amount: "-1", reason: "Customer request" }).success, false);
  assert.equal(refundRequestSchema.safeParse({ amount: "1", reason: "no" }).success, false);
});
