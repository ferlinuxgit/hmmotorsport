"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function JobActions({ jobId, status }: { jobId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const action = status === "queued" ? "cancel" : status === "failed" || status === "cancelled" ? "retry" : null;
  if (!action) return null;

  async function execute() {
    if (!window.confirm(action === "retry" ? "¿Reintentar este job desde el primer intento?" : "¿Cancelar este job?")) return;
    setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/admin/jobs/${jobId}`, {
        method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action })
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "No se pudo operar el job");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo operar el job");
    } finally { setBusy(false); }
  }

  return <div><Button type="button" size="sm" variant="outline" disabled={busy} onClick={execute}>{busy ? "Procesando…" : action === "retry" ? "Reintentar" : "Cancelar"}</Button>{error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}</div>;
}
