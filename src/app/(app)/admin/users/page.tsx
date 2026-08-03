import type { Metadata } from "next";
import Link from "next/link";

import { UserActions } from "@/components/admin/user-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listAdminUsers, parseAdminUserQuery } from "@/lib/admin/users";
import { requireAdminAccount } from "@/lib/auth/rbac";

export const metadata: Metadata = {
  title: "Usuarios | Backoffice",
  robots: { index: false, follow: false }
};

type SearchParams = Record<string, string | string[] | undefined>;

function toSearchParams(input: SearchParams) {
  const result = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string") result.set(key, value);
  }
  return result;
}

function formatDate(value: Date | null) {
  if (!value) return "Sin actividad";
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const account = await requireAdminAccount();
  const rawParams = await searchParams;
  let query: ReturnType<typeof parseAdminUserQuery>;
  try {
    query = parseAdminUserQuery(toSearchParams(rawParams));
  } catch {
    query = parseAdminUserQuery(new URLSearchParams());
  }
  const result = await listAdminUsers(query);

  function pageHref(page: number) {
    const params = toSearchParams(rawParams);
    params.set("page", String(page));
    return `/admin/users?${params.toString()}`;
  }

  return (
    <main id="main-content" className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 sm:py-14">
      <div className="space-y-3">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-primary">Identidad y acceso</p>
        <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Usuarios</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Busca cuentas, administra su acceso y conserva un registro auditable de cada cambio.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>La consulta se ejecuta en PostgreSQL y está paginada para crecer con el producto.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px_auto]" method="get">
            <Input name="q" defaultValue={query.q} placeholder="Email o nombre" aria-label="Buscar usuarios" />
            <select
              name="role"
              defaultValue={query.role}
              className="h-11 rounded-lg border border-input bg-background px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Filtrar por rol"
            >
              <option value="all">Todos los roles</option>
              <option value="admin">Administradores</option>
              <option value="user">Usuarios</option>
            </select>
            <select
              name="status"
              defaultValue={query.status}
              className="h-11 rounded-lg border border-input bg-background px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Filtrar por estado"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
            <Button type="submit">Aplicar</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{result.pagination.total} usuarios</CardTitle>
          <CardDescription>
            Página {result.pagination.page} de {result.pagination.pages}. No es posible retirar tu propio acceso ni desactivar
            el último administrador.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <caption className="sr-only">Usuarios, acceso y acciones administrativas</caption>
            <thead className="border-b text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-3 pr-4 font-medium">Usuario</th>
                <th className="py-3 pr-4 font-medium">Rol</th>
                <th className="py-3 pr-4 font-medium">Estado</th>
                <th className="py-3 pr-4 font-medium">Actividad</th>
                <th className="py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {result.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    No hay usuarios que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                result.items.map((user) => (
                  <tr key={user.id} className="border-b border-border/70 align-top last:border-b-0">
                    <td className="py-4 pr-4">
                      <p className="font-medium">{user.name ?? user.email}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <p className="mt-1 font-mono text-[11px] text-muted-foreground">{user.id.slice(0, 12)}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                    </td>
                    <td className="py-4 pr-4">
                      <Badge variant={user.active ? "default" : "outline"}>{user.active ? "Activo" : "Inactivo"}</Badge>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {user.emailVerified ? "Email verificado" : "Email pendiente"}
                      </p>
                    </td>
                    <td className="py-4 pr-4 text-muted-foreground">
                      <p>{formatDate(user.lastSignInAt)}</p>
                      <p className="mt-1 text-xs">Alta {formatDate(user.createdAt)}</p>
                    </td>
                    <td className="py-4">
                      <UserActions
                        userId={user.id}
                        role={user.role}
                        active={user.active}
                        isCurrentUser={user.id === account.id}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-4">
        {result.pagination.page > 1 ? (
          <Button asChild variant="outline">
            <Link href={pageHref(result.pagination.page - 1)}>Anterior</Link>
          </Button>
        ) : (
          <span />
        )}
        {result.pagination.page < result.pagination.pages ? (
          <Button asChild variant="outline">
            <Link href={pageHref(result.pagination.page + 1)}>Siguiente</Link>
          </Button>
        ) : null}
      </div>
    </main>
  );
}
