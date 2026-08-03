import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

test("local storage enforces workspace access and preserves file integrity", { skip: !process.env.TEST_DATABASE_URL }, async () => {
  const storageDirectory = await mkdtemp(join(tmpdir(), "baseboilerplate-storage-"));
  process.env.DATABASE_MODE = "external";
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.RATE_LIMIT_BACKEND = "database";
  process.env.STORAGE_PROVIDER = "local";
  process.env.STORAGE_LOCAL_DIR = storageDirectory;
  process.env.STORAGE_MAX_FILE_BYTES = "1024";
  process.env.STORAGE_ALLOWED_MIME_TYPES = "text/plain,application/pdf";

  const [{ eq }, { closeDb, getDb }, schema, storage] = await Promise.all([
    import("drizzle-orm"),
    import("../src/lib/db/client"),
    import("../src/lib/db/schema"),
    import("../src/lib/storage/service")
  ]);
  const db = getDb();
  const ownerId = randomUUID();
  const outsiderId = randomUUID();
  const workspaceId = randomUUID();
  const owner = { id: ownerId, email: `${ownerId}@example.test`, name: "Owner", imageUrl: null, role: "user" as const, emailVerified: true, active: true };
  const outsider = { id: outsiderId, email: `${outsiderId}@example.test`, name: "Outsider", imageUrl: null, role: "user" as const, emailVerified: true, active: true };
  let fileId: string | undefined;

  try {
    await db.insert(schema.users).values([{ id: ownerId, email: owner.email }, { id: outsiderId, email: outsider.email }]);
    await db.insert(schema.workspaces).values({ id: workspaceId, slug: `storage-${workspaceId}`, name: "Storage workspace", ownerId });
    await db.insert(schema.workspaceMembers).values({ workspaceId, userId: ownerId, membershipRole: "owner" });
    const bytes = new TextEncoder().encode("private workspace document");
    const asset = await storage.createFileAsset(owner, {
      filename: "../workspace-notes.txt", mimeType: "text/plain", sizeBytes: bytes.byteLength, workspaceId
    }, { requestId: "req_storage", clientIp: "127.0.0.1" });
    fileId = asset.id;
    assert.equal(asset.originalName, "workspace-notes.txt");
    await assert.rejects(() => storage.storeFileBytes(owner, asset.id, bytes.subarray(0, 2), "text/plain", {}), /size does not match/i);
    const uploaded = await storage.storeFileBytes(owner, asset.id, bytes, "text/plain", {});
    assert.equal(uploaded.status, "ready");
    assert.equal(uploaded.checksumSha256?.length, 64);
    const downloaded = await storage.readFileAsset(owner, asset.id);
    assert.equal(new TextDecoder().decode(downloaded.bytes), "private workspace document");
    await assert.rejects(
      () => storage.readFileAsset(outsider, asset.id),
      (error: unknown) => error instanceof storage.StorageOperationError && error.code === "FORBIDDEN"
    );
    await storage.deleteFileAsset(owner, asset.id, {});
    await assert.rejects(() => storage.readFileAsset(owner, asset.id), /not found/i);
    const events = await db.select().from(schema.auditLogs).where(eq(schema.auditLogs.entityId, asset.id));
    assert.deepEqual(events.map((item) => item.action).sort(), ["file.created", "file.deleted", "file.uploaded"]);
  } finally {
    if (fileId) await db.delete(schema.auditLogs).where(eq(schema.auditLogs.entityId, fileId));
    if (fileId) await db.delete(schema.fileAssets).where(eq(schema.fileAssets.id, fileId));
    await db.delete(schema.workspaces).where(eq(schema.workspaces.id, workspaceId));
    await db.delete(schema.users).where(eq(schema.users.id, outsiderId));
    await db.delete(schema.users).where(eq(schema.users.id, ownerId));
    await closeDb();
    await rm(storageDirectory, { recursive: true, force: true });
  }
});
