"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProgressRouter } from "@/components/navigation/navigation-progress";

export function WorkspaceCreateForm() {
  const router = useProgressRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/workspaces", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: data.get("name"), slug: data.get("slug"), ownerEmail: data.get("ownerEmail") })
      });
      const body = (await response.json()) as { error?: string; workspace?: { id: string } };
      if (!response.ok || !body.workspace) throw new Error(body.error ?? "No se pudo crear el workspace");
      router.push(`/admin/workspaces/${body.workspace.id}`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo crear el workspace");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 lg:grid-cols-[1fr_0.8fr_1fr_auto]">
      <Input name="name" required minLength={2} maxLength={255} placeholder="Nombre del workspace" aria-label="Nombre" />
      <Input name="slug" required minLength={2} maxLength={120} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="mi-negocio" aria-label="Slug" />
      <Input name="ownerEmail" required type="email" maxLength={255} placeholder="owner@empresa.com" aria-label="Email del propietario" />
      <Button type="submit" disabled={busy}>{busy ? "Creando…" : "Crear"}</Button>
      {error ? <p className="text-sm text-destructive lg:col-span-4">{error}</p> : null}
    </form>
  );
}
