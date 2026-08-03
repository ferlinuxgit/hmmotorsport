"use client";

import { useState } from "react";

import { useProgressRouter } from "@/components/navigation/navigation-progress";
import { Button } from "@/components/ui/button";

export function AcceptInvitation({ token, disabled }: { token: string; disabled: boolean }) {
  const router = useProgressRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function accept() {
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/invitations/accept", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "No se pudo aceptar la invitación");
      router.replace("/dashboard"); router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo aceptar la invitación"); setBusy(false); }
  }
  return <div><Button type="button" disabled={disabled || busy} onClick={accept}>{busy ? "Aceptando…" : "Aceptar invitación"}</Button>{error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}</div>;
}
