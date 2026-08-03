"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useProgressRouter } from "@/components/navigation/navigation-progress";
import { authClient } from "@/lib/auth/auth-client";

export function SignOutButton({ className }: { className?: string }) {
  const router = useProgressRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleSignOut() {
    setIsPending(true);

    try {
      const { error } = await authClient.signOut();

      if (error) {
        throw new Error(error.message || "No se pudo cerrar la sesión.");
      }

      router.replace("/");
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button className={className} variant="outline" onClick={handleSignOut} disabled={isPending}>
      {isPending ? "Saliendo..." : "Salir"}
    </Button>
  );
}
