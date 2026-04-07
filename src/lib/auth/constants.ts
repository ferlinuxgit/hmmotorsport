export const APP_ROLES = {
  ADMIN: "admin",
  USER: "user"
} as const;

export type AppRole = (typeof APP_ROLES)[keyof typeof APP_ROLES];

export function isAdminRole(role: string | null | undefined): role is "admin" {
  return role === APP_ROLES.ADMIN;
}

