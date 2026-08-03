"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FeatureFlagDefinition, RuntimeSettingDefinition } from "@/lib/modules/contracts";

type Setting = { definition: RuntimeSettingDefinition; value: unknown; version: number; source: "default" | "database" };
type Override = { workspaceId: string; enabled: boolean };
type Flag = { definition: FeatureFlagDefinition; enabled: boolean; rolloutPercentage: number; version: number; source: "default" | "database"; overrides: Override[] };

async function responseError(response: Response) {
  const body = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(body.error ?? "No se pudo guardar el cambio");
}

function SettingEditor({ setting }: { setting: Setting }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null);
    const data = new FormData(event.currentTarget);
    const raw = data.get("value");
    const value = setting.definition.kind === "boolean" ? raw === "true" : setting.definition.kind === "integer" ? Number(raw) : String(raw ?? "");
    try {
      const response = await fetch(`/api/admin/configuration/settings/${encodeURIComponent(setting.definition.key)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ value, expectedVersion: setting.version }) });
      await responseError(response); router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo guardar"); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="grid gap-4 border-b border-border/70 py-5 lg:grid-cols-[1fr_minmax(240px,420px)_auto] lg:items-end"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{setting.definition.title}</h3><Badge variant="outline">{setting.source}</Badge>{setting.definition.public ? <Badge variant="secondary">público</Badge> : null}</div><p className="mt-1 text-sm text-muted-foreground">{setting.definition.description}</p><p className="mt-1 font-mono text-[11px] text-muted-foreground">{setting.definition.key} · v{setting.version}</p></div><label className="text-xs font-medium text-muted-foreground">Valor{setting.definition.kind === "boolean" ? <select name="value" defaultValue={String(setting.value)} className="mt-2 block h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"><option value="true">Activado</option><option value="false">Desactivado</option></select> : <Input className="mt-2" name="value" type={setting.definition.kind === "integer" ? "number" : setting.definition.kind === "email" ? "email" : "text"} defaultValue={String(setting.value ?? "")} min={setting.definition.kind === "integer" ? setting.definition.min : undefined} max={setting.definition.kind === "integer" ? setting.definition.max : undefined} minLength={setting.definition.kind !== "integer" ? setting.definition.min : undefined} maxLength={setting.definition.kind !== "integer" ? setting.definition.max : undefined} />}</label><div><Button type="submit" disabled={busy}>{busy ? "Guardando…" : "Guardar"}</Button>{error ? <p className="mt-2 max-w-48 text-xs text-destructive">{error}</p> : null}</div></form>;
}

function FlagEditor({ flag }: { flag: Flag }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null);
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/admin/configuration/flags/${encodeURIComponent(flag.definition.key)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ enabled: data.get("enabled") === "true", rolloutPercentage: Number(data.get("rolloutPercentage")), expectedVersion: flag.version }) });
      await responseError(response); router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo guardar"); }
    finally { setBusy(false); }
  }
  async function setOverride(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null);
    const data = new FormData(event.currentTarget); const workspaceId = String(data.get("workspaceId"));
    try {
      const response = await fetch(`/api/admin/configuration/flags/${encodeURIComponent(flag.definition.key)}/workspaces/${workspaceId}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ enabled: data.get("overrideEnabled") === "true" }) });
      await responseError(response); event.currentTarget.reset(); router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo guardar el override"); }
    finally { setBusy(false); }
  }
  async function removeOverride(workspaceId: string) {
    setBusy(true); setError(null);
    try { const response = await fetch(`/api/admin/configuration/flags/${encodeURIComponent(flag.definition.key)}/workspaces/${workspaceId}`, { method: "DELETE" }); await responseError(response); router.refresh(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo eliminar el override"); }
    finally { setBusy(false); }
  }
  return <article className="border-b border-border/70 py-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{flag.definition.title}</h3><Badge variant={flag.enabled ? "default" : "outline"}>{flag.enabled ? "on" : "off"}</Badge><Badge variant="outline">{flag.source}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{flag.definition.description}</p><p className="mt-1 font-mono text-[11px] text-muted-foreground">{flag.definition.key} · v{flag.version}</p></div><form onSubmit={update} className="flex flex-wrap items-end gap-3"><label className="text-xs text-muted-foreground">Estado<select name="enabled" defaultValue={String(flag.enabled)} className="mt-1 block h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"><option value="true">On</option><option value="false">Off</option></select></label><label className="text-xs text-muted-foreground">Rollout %<Input name="rolloutPercentage" type="number" min={0} max={100} defaultValue={flag.rolloutPercentage} className="mt-1 w-28" /></label><Button type="submit" size="sm" disabled={busy}>Guardar</Button></form></div><form onSubmit={setOverride} className="mt-5 grid gap-3 rounded-xl bg-muted/40 p-4 md:grid-cols-[1fr_150px_auto]"><Input name="workspaceId" required pattern="[0-9a-fA-F-]{36}" placeholder="Workspace UUID" aria-label="Workspace UUID" /><select name="overrideEnabled" defaultValue="true" className="h-11 rounded-lg border border-input bg-background px-3 text-sm"><option value="true">Forzar on</option><option value="false">Forzar off</option></select><Button type="submit" variant="outline" disabled={busy}>Aplicar override</Button></form>{flag.overrides.length ? <div className="mt-3 flex flex-wrap gap-2">{flag.overrides.map((override) => <span key={override.workspaceId} className="inline-flex items-center gap-2 rounded-lg border border-border px-2 py-1 font-mono text-xs">{override.workspaceId} · {override.enabled ? "on" : "off"}<button type="button" disabled={busy} className="text-destructive hover:underline" onClick={() => removeOverride(override.workspaceId)}>quitar</button></span>)}</div> : null}{error ? <p className="mt-3 text-xs text-destructive">{error}</p> : null}</article>;
}

export function ConfigurationEditor({ settings, flags }: { settings: Setting[]; flags: Flag[] }) {
  return <div className="space-y-8"><section className="rounded-2xl border border-border/80 bg-card p-6"><h2 className="text-2xl font-semibold">Runtime settings</h2><p className="mt-1 text-sm text-muted-foreground">Sólo claves registradas por el core o un módulo; los cambios usan control optimista de versión.</p><div className="mt-3">{settings.map((setting) => <SettingEditor key={setting.definition.key} setting={setting} />)}</div></section><section className="rounded-2xl border border-border/80 bg-card p-6"><h2 className="text-2xl font-semibold">Feature flags</h2><p className="mt-1 text-sm text-muted-foreground">Rollout determinista por sujeto y overrides explícitos por workspace.</p><div className="mt-3">{flags.map((flag) => <FlagEditor key={flag.definition.key} flag={flag} />)}</div></section></div>;
}
