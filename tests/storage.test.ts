import assert from "node:assert/strict";
import { test } from "node:test";

import { parseAdminFileQuery } from "../src/lib/storage/admin";
import { sanitizeFilename } from "../src/lib/storage/service";

test("storage sanitizes filenames without trusting client paths", () => {
  assert.equal(sanitizeFilename("../../factura final.PDF"), "factura final.PDF");
  assert.equal(sanitizeFilename("C:\\fakepath\\photo.png"), "photo.png");
  assert.equal(sanitizeFilename("report\u0000.csv"), "report.csv");
  assert.throws(() => sanitizeFilename(".."), /Invalid filename/);
});

test("admin file queries are bounded and reject unsupported states", () => {
  assert.equal(parseAdminFileQuery(new URLSearchParams("pageSize=100")).pageSize, 100);
  assert.throws(() => parseAdminFileQuery(new URLSearchParams("pageSize=101")));
  assert.throws(() => parseAdminFileQuery(new URLSearchParams("status=infected")));
});
