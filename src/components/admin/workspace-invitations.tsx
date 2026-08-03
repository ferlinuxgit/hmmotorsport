"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Invitation = { id: string; email: string; role: string; status: string; expiresAt: string };

export function WorkspaceInvitations({ workspaceId, invitations }: { workspaceId: string; invitations: Invitation[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/admin/workspaces/${workspaceId}/invitations`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: data.get("email"), role: data.get("role"), expiresInDays: Number(data.get("expiresInDays")) })
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "No se pudo crear la invitación");
      form.reset(); router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo crear la invitación"); }
    finally { setBusy(false); }
  }

  async function revoke(id: string) {
    if (!window.confirm("¿Revocar esta invitación?")) return;
    setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/admin/workspaces/${workspaceId}/invitations/${id}`, { method: "DELETE" });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "No se pudo revocar la invitación");
      router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo revocar la invitación"); }
    finally { setBusy(false); }
  }

  return <section className="rounded-2xl border border-border/80 bg-card p-6">
    <h2 className="text-xl font-semibold">Invitaciones</h2>
    <p className="mt-1 text-sm text-muted-foreground">El email se entrega mediante la cola de jobs y el token no se almacena en claro.</p>
    <form onSubmit={invite} className="mt-5 grid gap-3 lg:grid-cols-[1fr_160px_140px_auto]">
      <Input name="email" type="email" required placeholder="persona@empresa.com" aria-label="Email invitado" />
      <select name="role" defaultValue="member" className="h-11 rounded-lg border border-input bg-background px-3 text-sm"><option value="member">Miembro</option><option value="admin">Admin</option></select>
      <select name="expiresInDays" defaultValue="7" className="h-11 rounded-lg border border-input bg-background px-3 text-sm"><option value="1">1 día</option><option value="7">7 días</option><option value="14">14 días</option><option value="30">30 días</option></select>
      <Button type="submit" disabled={busy}>{busy ? "Enviando…" : "Invitar"}</Button>
    </form>
    <div className="mt-5 divide-y divide-border/70">{invitations.length === 0 ? <p className="py-5 text-sm text-muted-foreground">Sin invitaciones activas.</p> : invitations.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 py-4"><div><p className="font-medium">{item.email}</p><p className="text-xs text-muted-foreground">Expira {new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.expiresAt))}</p></div><div className="flex items-center gap-2"><Badge variant="secondary">{item.role}</Badge><Badge variant={item.status === "pending" ? "default" : "outline"}>{item.status}</Badge>{item.status === "pending" ? <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => revoke(item.id)}>Revocar</Button> : null}</div></div>)}</div>
    {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
  </section>;
}
