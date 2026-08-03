"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Member = { userId: string; email: string; name: string | null; active: boolean; role: string };

export function WorkspaceManager({ workspace, members }: {
  workspace: { id: string; name: string; slug: string; active: boolean; ownerId: string; ownerEmail: string };
  members: Member[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function request(path: string, method: string, body?: Record<string, unknown>) {
    setBusy(`${method}:${path}`);
    setError(null);
    try {
      const response = await fetch(path, {
        method,
        headers: body ? { "content-type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "No se pudo completar la operación");
      router.refresh();
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo completar la operación");
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function saveWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await request(`/api/admin/workspaces/${workspace.id}`, "PATCH", {
      name: data.get("name"), slug: data.get("slug"), active: data.get("active") === "on"
    });
  }

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const completed = await request(`/api/admin/workspaces/${workspace.id}/members`, "POST", {
      email: data.get("email"), role: data.get("role")
    });
    if (completed) form.reset();
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border/80 bg-card p-6">
        <h2 className="text-xl font-semibold">Configuración</h2>
        <p className="mt-1 text-sm text-muted-foreground">Desactivar preserva relaciones, órdenes y auditoría.</p>
        <form onSubmit={saveWorkspace} className="mt-5 grid gap-3 md:grid-cols-[1fr_0.8fr_auto_auto] md:items-center">
          <Input name="name" defaultValue={workspace.name} required minLength={2} maxLength={255} aria-label="Nombre" />
          <Input name="slug" defaultValue={workspace.slug} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" aria-label="Slug" />
          <label className="flex h-11 items-center gap-2 rounded-lg border border-input px-3 text-sm">
            <input name="active" type="checkbox" defaultChecked={workspace.active} /> Activo
          </label>
          <Button type="submit" disabled={busy !== null}>{busy ? "Guardando…" : "Guardar"}</Button>
        </form>
      </section>

      <section className="rounded-2xl border border-border/80 bg-card p-6">
        <h2 className="text-xl font-semibold">Añadir miembro</h2>
        <p className="mt-1 text-sm text-muted-foreground">La cuenta debe existir y estar activa.</p>
        <form onSubmit={addMember} className="mt-5 grid gap-3 md:grid-cols-[1fr_180px_auto]">
          <Input name="email" type="email" required placeholder="usuario@empresa.com" aria-label="Email del miembro" />
          <select name="role" defaultValue="member" className="h-11 rounded-lg border border-input bg-background px-3 text-sm">
            <option value="member">Miembro</option><option value="admin">Administrador</option>
          </select>
          <Button type="submit" disabled={busy !== null}>Añadir</Button>
        </form>
      </section>

      <section className="rounded-2xl border border-border/80 bg-card p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h2 className="text-xl font-semibold">Miembros</h2><p className="mt-1 text-sm text-muted-foreground">{members.length} accesos registrados.</p></div>
          <p className="text-xs text-muted-foreground">Owner: {workspace.ownerEmail}</p>
        </div>
        <div className="mt-5 divide-y divide-border/70">
          {members.map((member) => {
            const owner = member.userId === workspace.ownerId;
            return (
              <article key={member.userId} className="grid gap-4 py-5 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{member.name ?? member.email}</p>
                    <Badge variant={owner ? "default" : "secondary"}>{owner ? "owner" : member.role}</Badge>
                    {!member.active ? <Badge variant="outline">cuenta inactiva</Badge> : null}
                  </div>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                </div>
                {owner ? <p className="text-xs text-muted-foreground">Ownership protegido</p> : (
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" disabled={busy !== null}
                      onClick={() => request(`/api/admin/workspaces/${workspace.id}/members/${member.userId}`, "PATCH", { role: member.role === "admin" ? "member" : "admin" })}>
                      {member.role === "admin" ? "Hacer miembro" : "Hacer admin"}
                    </Button>
                    <Button type="button" size="sm" variant="secondary" disabled={busy !== null}
                      onClick={() => window.confirm(`¿Transferir ownership a ${member.email}?`) && request(`/api/admin/workspaces/${workspace.id}`, "PATCH", { ownerEmail: member.email })}>
                      Transferir ownership
                    </Button>
                    <Button type="button" size="sm" variant="ghost" disabled={busy !== null}
                      onClick={() => window.confirm(`¿Eliminar a ${member.email} del workspace?`) && request(`/api/admin/workspaces/${workspace.id}/members/${member.userId}`, "DELETE")}>
                      Eliminar
                    </Button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      </section>
    </div>
  );
}
