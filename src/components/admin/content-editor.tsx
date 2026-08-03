"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { useProgressRouter } from "@/components/navigation/navigation-progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type EditablePage = { id: string; title: string; slug: string; summary: string | null; body: string; seoTitle: string | null; seoDescription: string | null; status: string; version: number };

async function getError(response: Response) {
  const body = (await response.json()) as { error?: string; page?: { id: string } };
  if (!response.ok) throw new Error(body.error ?? "No se pudo guardar la página");
  return body;
}

export function ContentCreateForm() {
  const router = useProgressRouter();
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null); const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/content", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: data.get("title"), slug: data.get("slug"), body: "" }) });
      const body = await getError(response); if (!body.page) throw new Error("La API no devolvió la página creada");
      router.push(`/admin/content/${body.page.id}`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo crear"); setBusy(false); }
  }
  return <form onSubmit={submit} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"><Input name="title" required minLength={2} maxLength={255} placeholder="Título" /><Input name="slug" required minLength={2} maxLength={160} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="slug-de-la-pagina" /><Button type="submit" disabled={busy}>{busy ? "Creando…" : "Crear borrador"}</Button>{error ? <p className="text-sm text-destructive md:col-span-3">{error}</p> : null}</form>;
}

export function ContentEditor({ page }: { page: EditablePage }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null); const [saved, setSaved] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null); setSaved(false); const data = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/admin/content/${page.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: data.get("title"), slug: data.get("slug"), summary: data.get("summary") || null, body: data.get("body"), seoTitle: data.get("seoTitle") || null, seoDescription: data.get("seoDescription") || null, status: data.get("status"), expectedVersion: page.version }) });
      await getError(response); setSaved(true); router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo guardar"); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="space-y-6"><div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-medium">Título<Input className="mt-2" name="title" required defaultValue={page.title} /></label><label className="text-sm font-medium">Slug<Input className="mt-2" name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={page.slug} /></label></div><label className="block text-sm font-medium">Resumen<textarea name="summary" maxLength={1000} defaultValue={page.summary ?? ""} className="mt-2 min-h-24 w-full rounded-xl border border-input bg-background p-3 text-sm" /></label><label className="block text-sm font-medium">Contenido<textarea name="body" maxLength={200000} defaultValue={page.body} className="mt-2 min-h-[360px] w-full rounded-xl border border-input bg-background p-4 font-mono text-sm leading-6" /></label><div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-medium">SEO title<Input className="mt-2" name="seoTitle" maxLength={255} defaultValue={page.seoTitle ?? ""} /></label><label className="text-sm font-medium">SEO description<Input className="mt-2" name="seoDescription" maxLength={320} defaultValue={page.seoDescription ?? ""} /></label></div><div className="flex flex-wrap items-end justify-between gap-4"><label className="text-sm font-medium">Estado<select name="status" defaultValue={page.status} className="mt-2 block h-11 rounded-lg border border-input bg-background px-3 text-sm"><option value="draft">Borrador</option><option value="published">Publicado</option><option value="archived">Archivado</option></select></label><div className="flex items-center gap-3">{saved ? <span className="text-sm text-muted-foreground">Guardado</span> : null}{error ? <span className="text-sm text-destructive">{error}</span> : null}<Button type="submit" disabled={busy}>{busy ? "Guardando…" : "Guardar cambios"}</Button></div></div></form>;
}
