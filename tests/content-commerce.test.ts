import assert from "node:assert/strict";
import { test } from "node:test";

import { contentPageCreateSchema, contentPageUpdateSchema, parseContentPageQuery } from "../src/lib/content/admin";
import { parseCommerceQuery, parseOrderQuery, priceCreateSchema, productCreateSchema } from "../src/lib/commerce/admin";

test("content contracts validate stable slugs, bounded bodies and optimistic versions", () => {
  assert.equal(contentPageCreateSchema.safeParse({ title: "About", slug: "about-us", body: "Text" }).success, true);
  assert.equal(contentPageCreateSchema.safeParse({ title: "About", slug: "About Us", body: "Text" }).success, false);
  assert.equal(contentPageUpdateSchema.safeParse({ status: "published", expectedVersion: 1 }).success, true);
  assert.equal(contentPageUpdateSchema.safeParse({ expectedVersion: 1 }).success, false);
  assert.throws(() => parseContentPageQuery(new URLSearchParams("pageSize=101")));
});

test("commerce contracts validate providers, money and bounded filters", () => {
  assert.equal(productCreateSchema.safeParse({ name: "Starter", slug: "starter-plan" }).success, true);
  assert.equal(priceCreateSchema.safeParse({ provider: "stripe", amount: "19.99", currency: "EUR" }).success, true);
  assert.equal(priceCreateSchema.safeParse({ provider: "stripe", amount: "19.999", currency: "EUR" }).success, false);
  assert.equal(priceCreateSchema.safeParse({ provider: "stripe", amount: "19.99", currency: "EUR", interval: "month" }).success, false);
  assert.equal(priceCreateSchema.safeParse({ provider: "manual", amount: "19", currency: "EUR" }).success, false);
  assert.throws(() => parseCommerceQuery(new URLSearchParams("page=0")));
  assert.throws(() => parseOrderQuery(new URLSearchParams("provider=manual")));
});
