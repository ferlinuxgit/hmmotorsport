import assert from "node:assert/strict";
import { test } from "node:test";

import { shouldTrackNavigation } from "../src/lib/navigation/progress";

const base = { currentHref: "https://app.example.com/dashboard?tab=one", button: 0, modified: false };

test("navigation progress tracks only meaningful same-origin page transitions", () => {
  assert.equal(shouldTrackNavigation({ ...base, href: "/account" }), true);
  assert.equal(shouldTrackNavigation({ ...base, href: "/dashboard?tab=two" }), true);
  assert.equal(shouldTrackNavigation({ ...base, href: "/dashboard?tab=one#details" }), false);
  assert.equal(shouldTrackNavigation({ ...base, href: "https://external.example.com" }), false);
  assert.equal(shouldTrackNavigation({ ...base, href: "/account", modified: true }), false);
  assert.equal(shouldTrackNavigation({ ...base, href: "/account", target: "_blank" }), false);
  assert.equal(shouldTrackNavigation({ ...base, href: "/download", download: true }), false);
  assert.equal(shouldTrackNavigation({ ...base, href: "mailto:help@example.com" }), false);
});
