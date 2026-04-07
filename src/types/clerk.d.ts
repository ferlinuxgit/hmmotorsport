export {};

declare global {
  interface CustomJwtSessionClaims {
    metadata?: {
      role?: "admin" | "user";
    };
  }
}

declare module "@clerk/types" {
  interface UserPublicMetadata {
    role?: "admin" | "user";
  }
}

