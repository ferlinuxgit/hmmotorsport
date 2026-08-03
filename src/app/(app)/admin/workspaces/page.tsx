import type { Metadata } from "next";
import Link from "next/link";

import { WorkspaceCreateForm } from "@/components/admin/workspace-create-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listAdminWorkspaces, parseAdminWorkspaceQuery } from "@/lib/admin/workspaces";

export const metadata: Metadata = { title: "Workspaces | Backoffice", robots: { index: false, follow: false } };
type SearchParams = Record<string, string | string[] | undefined>;
function paramsFrom(input: SearchParams) { const result = new URLSearchParams(); for (const [key, value] of Object.entries(input)) if (typeof value === "string") result.set(key, value); return result; }

export default async function AdminWorkspacesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const raw = await searchParams;
  let query: ReturnType<typeof parseAdminWorkspaceQuery>;
  try { query = parseAdminWorkspaceQuery(paramsFrom(raw)); } catch { query = parseAdminWorkspaceQuery(new URLSearchParams()); }
  const result = await listAdminWorkspaces(query);
  const pageHref = (page: number) => { const params = paramsFrom(raw); params.set("page", String(page)); return `/admin/workspaces?${params}`; };

  return (
    <main id="main-content" className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 sm:py-14">
      <div className="space-y-3"><p className="font-mono text-xs uppercase tracking-[0.14em] text-primary">Multi-tenancy</p><h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Workspaces</h1><p className="max-w-3xl text-sm leading-6 text-muted-foreground">Opera tenants, ownership y acceso sin intervenir directamente en PostgreSQL.</p></div>
      <Card><CardHeader><CardTitle>Nuevo workspace</CardTitle><CardDescription>El propietario debe ser una cuenta activa existente.</CardDescription></CardHeader><CardContent><WorkspaceCreateForm /></CardContent></Card>
      <Card><CardHeader><CardTitle>Buscar</CardTitle><CardDescription>Filtrado y paginación ejecutados en PostgreSQL.</CardDescription></CardHeader><CardContent><form method="get" className="grid gap-3 md:grid-cols-[1fr_180px_auto]"><Input name="q" defaultValue={query.q} placeholder="Nombre, slug u owner" /><select name="status" defaultValue={query.status} className="h-11 rounded-lg border border-input bg-background px-3 text-sm"><option value="all">Todos</option><option value="active">Activos</option><option value="inactive">Inactivos</option></select><Button type="submit">Aplicar</Button></form></CardContent></Card>
      <Card><CardHeader><CardTitle>{result.pagination.total} workspaces</CardTitle><CardDescription>Página {result.pagination.page} de {result.pagination.pages}.</CardDescription></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b text-xs uppercase text-muted-foreground"><tr><th className="py-3 pr-4">Workspace</th><th className="py-3 pr-4">Owner</th><th className="py-3 pr-4">Miembros</th><th className="py-3">Estado</th></tr></thead><tbody>{result.items.length === 0 ? <tr><td colSpan={4} className="py-12 text-center text-muted-foreground">Sin resultados.</td></tr> : result.items.map((workspace) => <tr key={workspace.id} className="border-b border-border/70"><td className="py-4 pr-4"><Link href={`/admin/workspaces/${workspace.id}`} className="font-medium text-primary hover:underline">{workspace.name}</Link><p className="font-mono text-xs text-muted-foreground">/{workspace.slug}</p></td><td className="py-4 pr-4">{workspace.ownerEmail}</td><td className="py-4 pr-4">{workspace.members}</td><td className="py-4"><Badge variant={workspace.active ? "default" : "outline"}>{workspace.active ? "Activo" : "Inactivo"}</Badge></td></tr>)}</tbody></table></CardContent></Card>
      <div className="flex justify-between">{result.pagination.page > 1 ? <Button asChild variant="outline"><Link href={pageHref(result.pagination.page - 1)}>Anterior</Link></Button> : <span />}{result.pagination.page < result.pagination.pages ? <Button asChild variant="outline"><Link href={pageHref(result.pagination.page + 1)}>Siguiente</Link></Button> : null}</div>
    </main>
  );
}
