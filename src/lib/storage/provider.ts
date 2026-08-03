import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, resolve, sep } from "node:path";

import { getStorageEnv, type StorageEnv } from "@/lib/config/env";

export type StorageProviderName = "local" | "s3";

export interface StorageProvider {
  readonly name: StorageProviderName;
  put(objectKey: string, bytes: Uint8Array, mimeType: string): Promise<void>;
  get(objectKey: string): Promise<Uint8Array>;
  delete(objectKey: string): Promise<void>;
}

function assertObjectKey(objectKey: string) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9/_.-]{0,699}$/.test(objectKey) || objectKey.includes("..")) {
    throw new Error("Invalid storage object key");
  }
}

class LocalStorageProvider implements StorageProvider {
  readonly name = "local" as const;
  private readonly root: string;

  constructor(directory: string) {
    this.root = isAbsolute(directory) ? resolve(directory) : resolve(/* turbopackIgnore: true */ process.cwd(), directory);
  }

  private path(objectKey: string) {
    assertObjectKey(objectKey);
    const target = resolve(this.root, objectKey);
    if (target !== this.root && !target.startsWith(`${this.root}${sep}`)) throw new Error("Invalid storage path");
    return target;
  }

  async put(objectKey: string, bytes: Uint8Array) {
    const target = this.path(objectKey);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, bytes);
  }

  async get(objectKey: string) {
    return new Uint8Array(await readFile(this.path(objectKey)));
  }

  async delete(objectKey: string) {
    try {
      await unlink(this.path(objectKey));
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    }
  }
}

class S3StorageProvider implements StorageProvider {
  readonly name = "s3" as const;
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(env: StorageEnv) {
    if (!env.S3_BUCKET) throw new Error("S3_BUCKET is required for the s3 storage provider");
    if (Boolean(env.S3_ACCESS_KEY_ID) !== Boolean(env.S3_SECRET_ACCESS_KEY)) {
      throw new Error("S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY must be configured together");
    }
    this.bucket = env.S3_BUCKET;
    this.client = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
      credentials: env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY
        ? { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY }
        : undefined
    });
  }

  async put(objectKey: string, bytes: Uint8Array, mimeType: string) {
    assertObjectKey(objectKey);
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: objectKey, Body: bytes, ContentType: mimeType }));
  }

  async get(objectKey: string) {
    assertObjectKey(objectKey);
    const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: objectKey }));
    if (!result.Body) throw new Error("Storage object has no body");
    return result.Body.transformToByteArray();
  }

  async delete(objectKey: string) {
    assertObjectKey(objectKey);
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: objectKey }));
  }
}

let cachedProvider: StorageProvider | undefined;

export function getStorageProvider(expected?: string): StorageProvider {
  const env = getStorageEnv();
  if (expected && expected !== env.STORAGE_PROVIDER) {
    throw new Error(`File uses ${expected} storage but ${env.STORAGE_PROVIDER} is configured`);
  }
  cachedProvider ??= env.STORAGE_PROVIDER === "s3" ? new S3StorageProvider(env) : new LocalStorageProvider(env.STORAGE_LOCAL_DIR);
  return cachedProvider;
}
