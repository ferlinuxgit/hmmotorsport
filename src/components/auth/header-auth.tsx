import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import type { AuthAccount } from "@/lib/auth/server";

export function HeaderAuth({ account }: { account: AuthAccount | null }) {
  if (!account) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" asChild>
          <Link href="/sign-in">Entrar</Link>
        </Button>
        <Button asChild>
          <Link href="/sign-up">Crear cuenta</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" asChild>
        <Link href="/dashboard">Dashboard</Link>
      </Button>
      <Button variant="ghost" asChild>
        <Link href="/account">Cuenta</Link>
      </Button>
      {account.role === "admin" ? (
        <Button variant="ghost" asChild>
          <Link href="/admin">Admin</Link>
        </Button>
      ) : null}
      <SignOutButton className="ml-1" />
    </div>
  );
}
