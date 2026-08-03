"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function FileActions({ fileId, ready }: { fileId: string; ready: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (!window.confirm("¿Eliminar este archivo? Esta acción elimina también el objeto almacenado.")) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/files/${fileId}`, { method: "DELETE" });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "No se pudo eliminar el archivo");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo eliminar el archivo");
      setBusy(false);
    }
  }

  return <div className="flex items-center gap-2">{ready ? <Button asChild size="sm" variant="outline"><a href={`/api/files/${fileId}/content`} target="_blank" rel="noreferrer">Abrir</a></Button> : null}<Button type="button" size="sm" variant="ghost" disabled={busy} onClick={remove}>{busy ? "Eliminando…" : "Eliminar"}</Button>{error ? <span className="text-xs text-destructive">{error}</span> : null}</div>;
}
