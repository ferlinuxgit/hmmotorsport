"use client";

import Link from "next/link";
import { SignInButton, SignUpButton, UserButton, useAuth, useUser } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

export function HeaderAuth() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const role = user?.publicMetadata?.role;

  return (
    <div className="flex items-center gap-3">
      {!isSignedIn ? (
        <SignInButton mode="redirect">
          <Button variant="ghost">Entrar</Button>
        </SignInButton>
      ) : null}
      {!isSignedIn ? (
        <SignUpButton mode="redirect">
          <Button>Crear cuenta</Button>
        </SignUpButton>
      ) : null}

      {isSignedIn ? (
        <>
        <Button variant="ghost" asChild>
          <Link href="/dashboard">Dashboard</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/account">Cuenta</Link>
        </Button>
        {role === "admin" ? (
          <Button variant="ghost" asChild>
            <Link href="/admin">Admin</Link>
          </Button>
        ) : null}
        <UserButton />
        </>
      ) : null}
    </div>
  );
}
