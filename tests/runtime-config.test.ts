import assert from "node:assert/strict";
import { test } from "node:test";

import { isSubjectInRollout, validateSettingValue } from "../src/lib/config/runtime";
import type { RuntimeSettingDefinition } from "../src/lib/modules/contracts";
import { requireUniqueRegistryKeys } from "../src/lib/modules/loader";

test("runtime settings enforce their registered type and bounds", () => {
  const integer: RuntimeSettingDefinition = { key: "test.days", title: "Days", description: "Test", kind: "integer", defaultValue: 14, public: false, min: 0, max: 30 };
  assert.equal(validateSettingValue(integer, 30), 30);
  assert.throws(() => validateSettingValue(integer, 31), /<=30/);
  assert.throws(() => validateSettingValue(integer, "14"));
  const text: RuntimeSettingDefinition = { key: "test.label", title: "Label", description: "Test", kind: "string", defaultValue: "", public: true, max: 4 };
  assert.equal(validateSettingValue(text, "okay"), "okay");
  assert.throws(() => validateSettingValue(text, "too long"));
});

test("feature rollout is stable, bounded and varies across subjects", () => {
  assert.equal(isSubjectInRollout("test.flag", "subject", 0), false);
  assert.equal(isSubjectInRollout("test.flag", "subject", 100), true);
  assert.equal(isSubjectInRollout("test.flag", "subject", 50), isSubjectInRollout("test.flag", "subject", 50));
  const results = new Set(Array.from({ length: 100 }, (_, index) => isSubjectInRollout("test.flag", `subject-${index}`, 50)));
  assert.deepEqual([...results].sort(), [false, true]);
});

test("extension registries fail fast instead of silently overriding duplicate keys", () => {
  assert.throws(
    () => requireUniqueRegistryKeys([{ key: "duplicate" }, { key: "duplicate" }], "test registry"),
    /Duplicate test registry key: duplicate/
  );
  assert.deepEqual(requireUniqueRegistryKeys([{ key: "first" }, { key: "second" }], "test registry").map((item) => item.key), ["first", "second"]);
});
