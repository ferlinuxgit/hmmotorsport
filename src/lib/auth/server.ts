import { auth, currentUser } from "@clerk/nextjs/server";
import { desc, eq, or } from "drizzle-orm";
import { cache } from "react";

import { APP_ROLES, type AppRole, isAdminRole } from "@/lib/auth/constants";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

export interface AuthAccount {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  imageUrl: string | null;
  role: AppRole;
}

function normalizeRole(role: unknown): AppRole {
  return isAdminRole(typeof role === "string" ? role : undefined) ? APP_ROLES.ADMIN : APP_ROLES.USER;
}

export const getCurrentAccount = cache(async (): Promise<AuthAccount | null> => {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const primaryEmail =
    clerkUser.primaryEmailAddress?.emailAddress ?? clerkUser.emailAddresses.find((email) => email.id)?.emailAddress;

  if (!primaryEmail) {
    throw new Error("Authenticated Clerk user does not have a primary email address");
  }

  const role = normalizeRole(clerkUser.publicMetadata?.role);
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || primaryEmail;
  const imageUrl = clerkUser.imageUrl ?? null;
  const db = getDb();

  const [existingUser] = await db
    .select({
      id: users.id,
      clerkId: users.clerkId,
      email: users.email,
      name: users.name,
      imageUrl: users.imageUrl,
      role: users.role,
      active: users.active
    })
    .from(users)
    .where(or(eq(users.clerkId, clerkUser.id), eq(users.email, primaryEmail)))
    .limit(1);

  const values = {
    clerkId: clerkUser.id,
    email: primaryEmail,
    name,
    imageUrl,
    role,
    active: true
  };

  const requiresUpdate =
    !existingUser ||
    existingUser.email !== primaryEmail ||
    existingUser.name !== name ||
    existingUser.imageUrl !== imageUrl ||
    existingUser.role !== role ||
    existingUser.active !== true ||
    existingUser.clerkId !== clerkUser.id;

  const [record] = !existingUser
    ? await db
        .insert(users)
        .values({
          ...values,
          lastSignInAt: new Date(),
          updatedAt: new Date()
        })
        .returning({
          id: users.id,
          clerkId: users.clerkId,
          email: users.email,
          name: users.name,
          imageUrl: users.imageUrl,
          role: users.role
        })
    : requiresUpdate
      ? await db
          .update(users)
          .set({
            ...values,
            updatedAt: new Date()
          })
          .where(eq(users.id, existingUser.id))
          .returning({
            id: users.id,
            clerkId: users.clerkId,
            email: users.email,
            name: users.name,
            imageUrl: users.imageUrl,
            role: users.role
          })
      : [
          {
            id: existingUser.id,
            clerkId: existingUser.clerkId,
            email: existingUser.email,
            name: existingUser.name,
            imageUrl: existingUser.imageUrl,
            role: existingUser.role
          }
        ];

  return {
    id: record.id,
    clerkId: record.clerkId,
    email: record.email,
    name: record.name ?? primaryEmail,
    imageUrl: record.imageUrl ?? null,
    role: normalizeRole(record.role)
  };
});

export async function listRecentUsers(limit = 20) {
  const db = getDb();

  return db
    .select({
      id: users.id,
      clerkId: users.clerkId,
      email: users.email,
      name: users.name,
      imageUrl: users.imageUrl,
      role: users.role,
      active: users.active,
      createdAt: users.createdAt,
      lastSignInAt: users.lastSignInAt
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit);
}
