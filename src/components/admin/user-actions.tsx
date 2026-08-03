"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

interface UserActionsProps {
  userId: string;
  role: string;
  active: boolean;
  isCurrentUser: boolean;
}

export function UserActions({ userId, role, active, isCurrentUser }: UserActionsProps) {
  const router = useRouter();
  const [busyAction, setBusyAction] = useState<"role" | "status" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateUser(action: "role" | "status") {
    const nextValue = action === "role" ? (role === "admin" ? "user" : "admin") : !active;
    const label =
      action === "role"
        ? role === "admin"
          ? "retirar el rol administrador"
          : "conceder el rol administrador"
        : active
          ? "desactivar esta cuenta"
          : "reactivar esta cuenta";

    if (!window.confirm(`¿Confirmas que quieres ${label}?`)) {
      return;
    }

    setBusyAction(action);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(action === "role" ? { role: nextValue } : { active: nextValue })
      });
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error ?? "No se pudo actualizar el usuario");
      }

      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo actualizar el usuario");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isCurrentUser || busyAction !== null}
          onClick={() => updateUser("role")}
        >
          {busyAction === "role" ? "Guardando…" : role === "admin" ? "Hacer usuario" : "Hacer admin"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={active ? "ghost" : "secondary"}
          disabled={isCurrentUser || busyAction !== null}
          onClick={() => updateUser("status")}
        >
          {busyAction === "status" ? "Guardando…" : active ? "Desactivar" : "Reactivar"}
        </Button>
      </div>
      {isCurrentUser ? <p className="text-xs text-muted-foreground">Tu propio acceso está protegido.</p> : null}
      {error ? <p className="max-w-xs text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
