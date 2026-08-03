import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { resolveDatabaseUrl } from "../src/lib/config/database";
import { getProductionReadinessIssues } from "../src/lib/config/env";
import { decimalToMinorUnits, getCurrencyMinorUnit, normalizeCurrency } from "../src/lib/payments/money";

test("resolveDatabaseUrl builds an internal Postgres URL", () => {
  const url = resolveDatabaseUrl({
    DATABASE_MODE: "internal",
    POSTGRES_HOST: "db",
    POSTGRES_PORT: "5433",
    POSTGRES_DB: "app",
    POSTGRES_USER: "user@example.com",
    POSTGRES_PASSWORD: "p@ss word",
    POSTGRES_SSL: "true"
  } as unknown as NodeJS.ProcessEnv);

  assert.equal(url, "postgres://user%40example.com:p%40ss%20word@db:5433/app?sslmode=require");
});

test("resolveDatabaseUrl requires DATABASE_URL for external mode", () => {
  assert.throws(() => resolveDatabaseUrl({ DATABASE_MODE: "external" } as unknown as NodeJS.ProcessEnv), /DATABASE_URL/);
  assert.equal(
    resolveDatabaseUrl({ DATABASE_MODE: "external" } as unknown as NodeJS.ProcessEnv, { allowMissing: true }),
    undefined
  );
});

test("money helpers normalize provider input", () => {
  assert.equal(decimalToMinorUnits("19.00"), 1900);
  assert.equal(decimalToMinorUnits("19.9"), 1990);
  assert.equal(decimalToMinorUnits("19.000", "EUR"), 1900);
  assert.equal(decimalToMinorUnits("500", "JPY"), 500);
  assert.equal(decimalToMinorUnits("19.999", "KWD"), 19999);
  assert.equal(getCurrencyMinorUnit("jpy"), 0);
  assert.throws(() => decimalToMinorUnits("19.999", "USD"), /more than 2 decimal places/);
  assert.equal(normalizeCurrency(" usd "), "USD");
});

test("package dependencies are pinned", async () => {
  const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8")) as {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  };

  const versions = [...Object.values(packageJson.dependencies), ...Object.values(packageJson.devDependencies)];
  assert.equal(versions.every((version) => /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version) || version === "file:vendor/brace-expansion-compat"), true);
});

test("production readiness rejects placeholder secrets", () => {
  const issues = getProductionReadinessIssues({
    DEPLOYMENT_ENV: "production",
    APP_NAME: "App",
    APP_DESCRIPTION: "Description",
    APP_URL: "https://example.com",
    BETTER_AUTH_SECRET: "replace-with-a-long-random-secret-of-at-least-32-characters",
    BETTER_AUTH_URL: "https://example.com",
    DATABASE_MODE: "internal",
    POSTGRES_PASSWORD: "postgres",
    BUILD_SHA: "",
    STRIPE_SECRET_KEY: "stripe_dummy"
  } as unknown as NodeJS.ProcessEnv);

  assert.equal(issues.some((issue) => issue.includes("BETTER_AUTH_SECRET")), true);
  assert.equal(issues.some((issue) => issue.includes("POSTGRES_PASSWORD")), true);
  assert.equal(issues.some((issue) => issue.includes("BUILD_SHA")), true);
  assert.equal(issues.some((issue) => issue.includes("STRIPE_SECRET_KEY")), true);
});

test("production readiness accepts explicit production settings", () => {
  const issues = getProductionReadinessIssues({
    DEPLOYMENT_ENV: "production",
    APP_NAME: "App",
    APP_DESCRIPTION: "Description",
    APP_URL: "https://example.com",
    BETTER_AUTH_SECRET: "real-production-secret-with-at-least-32-characters",
    BETTER_AUTH_URL: "https://example.com",
    DATABASE_MODE: "external",
    DATABASE_URL: "postgres://user:password@db.example.com:5432/app",
    RATE_LIMIT_BACKEND: "database",
    TRUST_PROXY_HEADERS: "true",
    BUILD_SHA: "abc123",
    JOB_RUNNER_SECRET: "real-job-runner-secret-with-at-least-32-characters",
    EMAIL_PROVIDER: "smtp",
    EMAIL_FROM: "noreply@example.com",
    SMTP_URL: "smtp://user:password@mail.example.com:587",
    STORAGE_PROVIDER: "s3",
    S3_BUCKET: "production-assets",
    S3_REGION: "eu-west-1"
  } as unknown as NodeJS.ProcessEnv);

  assert.deepEqual(issues, []);
});

test("production readiness requires credentials for installed payment providers", () => {
  const issues = getProductionReadinessIssues({
    DEPLOYMENT_ENV: "production",
    APP_NAME: "App",
    APP_DESCRIPTION: "Description",
    APP_URL: "https://example.com",
    BETTER_AUTH_SECRET: "real-production-secret-with-at-least-32-characters",
    BETTER_AUTH_URL: "https://example.com",
    DATABASE_MODE: "external",
    DATABASE_URL: "postgres://user:password@db.example.com:5432/app",
    RATE_LIMIT_BACKEND: "database",
    TRUST_PROXY_HEADERS: "true",
    BUILD_SHA: "abc123",
    JOB_RUNNER_SECRET: "real-job-runner-secret-with-at-least-32-characters",
    EMAIL_PROVIDER: "smtp",
    EMAIL_FROM: "noreply@example.com",
    SMTP_URL: "smtp://user:password@mail.example.com:587",
    STORAGE_PROVIDER: "s3",
    S3_BUCKET: "production-assets",
    S3_REGION: "eu-west-1"
  } as unknown as NodeJS.ProcessEnv, { requiredPaymentProviders: ["stripe", "paypal"] });

  assert.equal(issues.some((issue) => issue.includes("STRIPE_SECRET_KEY is required")), true);
  assert.equal(issues.some((issue) => issue.includes("STRIPE_WEBHOOK_SECRET is required")), true);
  assert.equal(issues.some((issue) => issue.includes("PAYPAL_CLIENT_ID is required")), true);
  assert.equal(issues.some((issue) => issue.includes("PAYPAL_WEBHOOK_ID is required")), true);
});
