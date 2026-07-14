import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { cache } from "react";

import { getAuth, isBetterAuthConfigured } from "@/lib/auth/auth";
import { APP_ROLES, type AppRole, isAdminRole } from "@/lib/auth/constants";
import { getBetterAuthEnv } from "@/lib/config/env";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

export interface AuthAccount {
  id: string;
  email: string;
  name: string;
  imageUrl: string | null;
  role: AppRole;
  emailVerified: boolean;
  active: boolean;
}

function normalizeRole(role: unknown): AppRole {
  return isAdminRole(typeof role === "string" ? role : undefined) ? APP_ROLES.ADMIN : APP_ROLES.USER;
}

function getAdminEmails() {
  const { AUTH_ADMIN_EMAILS } = getBetterAuthEnv();

  return new Set(
    AUTH_ADMIN_EMAILS?.split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean) ?? []
  );
}

export const getCurrentAccount = cache(async (): Promise<AuthAccount | null> => {
  if (!isBetterAuthConfigured()) {
    return null;
  }

  const session = await getAuth().api.getSession({
    headers: await headers()
  });

  if (!session) {
    return null;
  }

  const db = getDb();
  const now = new Date();
  const [existingUser] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      imageUrl: users.imageUrl,
      emailVerified: users.emailVerified,
      role: users.role,
      active: users.active,
      lastSignInAt: users.lastSignInAt
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const role =
    getAdminEmails().has(session.user.email.toLowerCase()) || isAdminRole(existingUser?.role) ? APP_ROLES.ADMIN : APP_ROLES.USER;

  if (existingUser && !existingUser.active) {
    return null;
  }

  const shouldRefreshLastSignIn =
    !existingUser?.lastSignInAt || now.getTime() - existingUser.lastSignInAt.getTime() >= 1000 * 60 * 15;

  const values = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name || session.user.email,
    imageUrl: session.user.image ?? null,
    emailVerified: session.user.emailVerified,
    role
  };

  const requiresUpdate =
    !existingUser ||
    existingUser.email !== values.email ||
    existingUser.name !== values.name ||
    existingUser.imageUrl !== values.imageUrl ||
    existingUser.emailVerified !== values.emailVerified ||
    existingUser.role !== values.role ||
    shouldRefreshLastSignIn;

  let record:
    | {
        id: string;
        email: string;
        name: string | null;
        imageUrl: string | null;
        emailVerified: boolean;
        role: string;
        active: boolean;
      }
    | undefined;

  if (!existingUser) {
    [record] = await db
      .insert(users)
      .values({
        ...values,
        active: true,
        lastSignInAt: now,
        updatedAt: now
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        imageUrl: users.imageUrl,
        emailVerified: users.emailVerified,
        role: users.role,
        active: users.active
      });
  } else if (requiresUpdate) {
    [record] = await db
      .update(users)
      .set({
        ...values,
        lastSignInAt: shouldRefreshLastSignIn ? now : existingUser.lastSignInAt,
        updatedAt: now
      })
      .where(eq(users.id, existingUser.id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        imageUrl: users.imageUrl,
        emailVerified: users.emailVerified,
        role: users.role,
        active: users.active
      });
  } else {
    record = {
      id: existingUser.id,
      email: existingUser.email,
      name: existingUser.name,
      imageUrl: existingUser.imageUrl,
      emailVerified: existingUser.emailVerified,
      role: existingUser.role,
      active: existingUser.active
    };
  }

  if (!record) {
    throw new Error("Could not synchronize authenticated user");
  }

  return {
    id: record.id,
    email: record.email,
    name: record.name ?? session.user.email,
    imageUrl: record.imageUrl ?? null,
    role: normalizeRole(record.role),
    emailVerified: record.emailVerified,
    active: record.active
  };
});

export async function listRecentUsers(limit = 20) {
  const db = getDb();

  return db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      imageUrl: users.imageUrl,
      emailVerified: users.emailVerified,
      role: users.role,
      active: users.active,
      createdAt: users.createdAt,
      lastSignInAt: users.lastSignInAt
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit);
}
