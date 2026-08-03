import { createHash } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import type { AuthAccount } from "@/lib/auth/server";
import { getDb } from "@/lib/db/client";
import { auditLogs, featureFlags, runtimeSettings, workspaceFeatureFlagOverrides } from "@/lib/db/schema";
import { getFeatureFlagDefinitions, getRuntimeSettingDefinitions } from "@/lib/modules/loader";
import type { FeatureFlagDefinition, RuntimeSettingDefinition } from "@/lib/modules/contracts";

export class ConfigurationOperationError extends Error {
  constructor(message: string, readonly code: "NOT_FOUND" | "CONFLICT" | "INVALID_VALUE", readonly status: 400 | 404 | 409) {
    super(message);
    this.name = "ConfigurationOperationError";
  }
}

function settingDefinition(key: string) {
  const definition = getRuntimeSettingDefinitions().find((item) => item.key === key);
  if (!definition) throw new ConfigurationOperationError("Setting is not registered", "NOT_FOUND", 404);
  return definition;
}

function flagDefinition(key: string) {
  const definition = getFeatureFlagDefinitions().find((item) => item.key === key);
  if (!definition) throw new ConfigurationOperationError("Feature flag is not registered", "NOT_FOUND", 404);
  return definition;
}

export function validateSettingValue(definition: RuntimeSettingDefinition, value: unknown) {
  let schema: z.ZodType;
  if (definition.kind === "boolean") schema = z.boolean();
  else if (definition.kind === "integer") schema = z.number().int().min(definition.min ?? Number.MIN_SAFE_INTEGER).max(definition.max ?? Number.MAX_SAFE_INTEGER);
  else if (definition.kind === "email") schema = z.email().max(definition.max ?? 255);
  else schema = z.string().min(definition.min ?? 0).max(definition.max ?? 2_000);
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new ConfigurationOperationError(parsed.error.issues[0]?.message ?? "Invalid setting value", "INVALID_VALUE", 400);
  return parsed.data as boolean | string | number;
}

export function isSubjectInRollout(flagKey: string, subjectId: string, percentage: number) {
  if (percentage <= 0) return false;
  if (percentage >= 100) return true;
  const bucket = createHash("sha256").update(`${flagKey}:${subjectId}`).digest().readUInt32BE(0) % 100;
  return bucket < percentage;
}

export async function getRuntimeSetting(key: string) {
  const definition = settingDefinition(key);
  const [stored] = await getDb().select({ value: runtimeSettings.value }).from(runtimeSettings).where(eq(runtimeSettings.key, key)).limit(1);
  return stored ? validateSettingValue(definition, stored.value) : definition.defaultValue;
}

export async function getPublicRuntimeSettings() {
  const definitions = getRuntimeSettingDefinitions().filter((item) => item.public);
  const stored = await getDb().select({ key: runtimeSettings.key, value: runtimeSettings.value }).from(runtimeSettings);
  const values = new Map(stored.map((item) => [item.key, item.value]));
  return Object.fromEntries(definitions.map((definition) => [definition.key, values.has(definition.key) ? validateSettingValue(definition, values.get(definition.key)) : definition.defaultValue]));
}

export async function isFeatureEnabled(key: string, context: { workspaceId?: string; subjectId?: string } = {}) {
  const definition = flagDefinition(key);
  const db = getDb();
  if (context.workspaceId) {
    const [override] = await db.select({ enabled: workspaceFeatureFlagOverrides.enabled }).from(workspaceFeatureFlagOverrides)
      .where(and(eq(workspaceFeatureFlagOverrides.flagKey, key), eq(workspaceFeatureFlagOverrides.workspaceId, context.workspaceId))).limit(1);
    if (override) return override.enabled;
  }
  const [stored] = await db.select({ enabled: featureFlags.enabled, rolloutPercentage: featureFlags.rolloutPercentage }).from(featureFlags).where(eq(featureFlags.key, key)).limit(1);
  const enabled = stored?.enabled ?? definition.defaultEnabled;
  const rollout = stored?.rolloutPercentage ?? definition.defaultRolloutPercentage ?? 100;
  if (!enabled) return false;
  return context.subjectId ? isSubjectInRollout(key, context.subjectId, rollout) : rollout === 100;
}

export async function listRuntimeConfiguration() {
  const db = getDb();
  const [settings, flags, overrides] = await Promise.all([
    db.select().from(runtimeSettings),
    db.select().from(featureFlags),
    db.select().from(workspaceFeatureFlagOverrides)
  ]);
  const settingMap = new Map(settings.map((item) => [item.key, item]));
  const flagMap = new Map(flags.map((item) => [item.key, item]));
  return {
    settings: getRuntimeSettingDefinitions().map((definition) => {
      const stored = settingMap.get(definition.key);
      return { definition, value: stored?.value ?? definition.defaultValue, version: stored?.version ?? 0, source: stored ? "database" as const : "default" as const, updatedAt: stored?.updatedAt ?? null };
    }),
    flags: getFeatureFlagDefinitions().map((definition) => {
      const stored = flagMap.get(definition.key);
      return { definition, enabled: stored?.enabled ?? definition.defaultEnabled, rolloutPercentage: stored?.rolloutPercentage ?? definition.defaultRolloutPercentage ?? 100, version: stored?.version ?? 0, source: stored ? "database" as const : "default" as const, updatedAt: stored?.updatedAt ?? null, overrides: overrides.filter((item) => item.flagKey === definition.key) };
    })
  };
}

const expectedVersionSchema = z.number().int().min(0);

export async function updateRuntimeSetting(actor: AuthAccount, key: string, input: { value: unknown; expectedVersion: number }, context: { requestId?: string; clientIp?: string }) {
  const definition = settingDefinition(key);
  const value = validateSettingValue(definition, input.value);
  const expectedVersion = expectedVersionSchema.parse(input.expectedVersion);
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`setting:${key}`}, 0))`);
    const [current] = await tx.select().from(runtimeSettings).where(eq(runtimeSettings.key, key)).limit(1);
    const version = current?.version ?? 0;
    if (version !== expectedVersion) throw new ConfigurationOperationError("Setting changed since it was loaded", "CONFLICT", 409);
    const [updated] = await tx.insert(runtimeSettings).values({ key, value, version: version + 1, updatedBy: actor.id })
      .onConflictDoUpdate({ target: runtimeSettings.key, set: { value, version: version + 1, updatedBy: actor.id, updatedAt: new Date() } }).returning();
    await tx.insert(auditLogs).values({
      actorUserId: actor.id, action: "configuration.setting_updated", entityType: "runtime_setting", entityId: key,
      requestId: context.requestId?.slice(0, 128), ipAddress: context.clientIp?.slice(0, 64), metadata: { previousValue: current?.value ?? definition.defaultValue, value, version: version + 1 }
    });
    return updated;
  });
}

export async function updateFeatureFlag(actor: AuthAccount, key: string, input: { enabled: boolean; rolloutPercentage: number; expectedVersion: number }, context: { requestId?: string; clientIp?: string }) {
  const definition = flagDefinition(key);
  const value = z.object({ enabled: z.boolean(), rolloutPercentage: z.number().int().min(0).max(100), expectedVersion: expectedVersionSchema }).parse(input);
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`flag:${key}`}, 0))`);
    const [current] = await tx.select().from(featureFlags).where(eq(featureFlags.key, key)).limit(1);
    const version = current?.version ?? 0;
    if (version !== value.expectedVersion) throw new ConfigurationOperationError("Feature flag changed since it was loaded", "CONFLICT", 409);
    const [updated] = await tx.insert(featureFlags).values({ key, enabled: value.enabled, rolloutPercentage: value.rolloutPercentage, version: version + 1, updatedBy: actor.id })
      .onConflictDoUpdate({ target: featureFlags.key, set: { enabled: value.enabled, rolloutPercentage: value.rolloutPercentage, version: version + 1, updatedBy: actor.id, updatedAt: new Date() } }).returning();
    await tx.insert(auditLogs).values({
      actorUserId: actor.id, action: "configuration.flag_updated", entityType: "feature_flag", entityId: key,
      requestId: context.requestId?.slice(0, 128), ipAddress: context.clientIp?.slice(0, 64),
      metadata: { previous: current ? { enabled: current.enabled, rolloutPercentage: current.rolloutPercentage } : { enabled: definition.defaultEnabled, rolloutPercentage: definition.defaultRolloutPercentage ?? 100 }, value: { enabled: value.enabled, rolloutPercentage: value.rolloutPercentage }, version: version + 1 }
    });
    return updated;
  });
}

async function ensureStoredFlag(tx: Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0], definition: FeatureFlagDefinition, actorId: string) {
  await tx.insert(featureFlags).values({ key: definition.key, enabled: definition.defaultEnabled, rolloutPercentage: definition.defaultRolloutPercentage ?? 100, updatedBy: actorId }).onConflictDoNothing();
}

export async function setWorkspaceFeatureFlagOverride(actor: AuthAccount, key: string, workspaceId: string, enabled: boolean, context: { requestId?: string; clientIp?: string }) {
  const definition = flagDefinition(key);
  return getDb().transaction(async (tx) => {
    await ensureStoredFlag(tx, definition, actor.id);
    const [override] = await tx.insert(workspaceFeatureFlagOverrides).values({ flagKey: key, workspaceId, enabled, updatedBy: actor.id })
      .onConflictDoUpdate({ target: [workspaceFeatureFlagOverrides.flagKey, workspaceFeatureFlagOverrides.workspaceId], set: { enabled, updatedBy: actor.id, updatedAt: new Date() } }).returning();
    await tx.insert(auditLogs).values({ actorUserId: actor.id, workspaceId, action: "configuration.flag_override_set", entityType: "feature_flag", entityId: key, requestId: context.requestId?.slice(0, 128), ipAddress: context.clientIp?.slice(0, 64), metadata: { enabled } });
    return override;
  });
}

export async function removeWorkspaceFeatureFlagOverride(actor: AuthAccount, key: string, workspaceId: string, context: { requestId?: string; clientIp?: string }) {
  flagDefinition(key);
  return getDb().transaction(async (tx) => {
    const [removed] = await tx.delete(workspaceFeatureFlagOverrides).where(and(eq(workspaceFeatureFlagOverrides.flagKey, key), eq(workspaceFeatureFlagOverrides.workspaceId, workspaceId))).returning();
    if (!removed) throw new ConfigurationOperationError("Feature flag override not found", "NOT_FOUND", 404);
    await tx.insert(auditLogs).values({ actorUserId: actor.id, workspaceId, action: "configuration.flag_override_removed", entityType: "feature_flag", entityId: key, requestId: context.requestId?.slice(0, 128), ipAddress: context.clientIp?.slice(0, 64), metadata: { previousEnabled: removed.enabled } });
    return removed;
  });
}
