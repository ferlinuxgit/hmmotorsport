import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listAuditLogs, parseAuditLogQuery } from "@/lib/admin/audit";

export const metadata: Metadata = {
  title: "Auditoría | Backoffice",
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

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "medium" }).format(value);
}

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const rawParams = await searchParams;
  let query: ReturnType<typeof parseAuditLogQuery>;
  try {
    query = parseAuditLogQuery(toSearchParams(rawParams));
  } catch {
    query = parseAuditLogQuery(new URLSearchParams());
  }
  const result = await listAuditLogs(query);

  function pageHref(page: number) {
    const params = toSearchParams(rawParams);
    params.set("page", String(page));
    return `/admin/audit?${params.toString()}`;
  }

  return (
    <main id="main-content" className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 sm:py-14">
      <div className="space-y-3">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-primary">Trazabilidad</p>
        <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Auditoría</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Registro inmutable de las mutaciones administrativas realizadas desde el backend.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar eventos</CardTitle>
          <CardDescription>Busca por acción, entidad, identificador o email del operador.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-3 sm:flex-row" method="get">
            <Input name="q" defaultValue={query.q} placeholder="user.updated, email o ID" aria-label="Buscar auditoría" />
            <Button type="submit">Buscar</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{result.pagination.total} eventos</CardTitle>
          <CardDescription>
            Página {result.pagination.page} de {result.pagination.pages}. Los registros no contienen contraseñas, tokens ni
            secretos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-0">
          {result.items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Todavía no hay acciones auditadas.</p>
          ) : (
            result.items.map((event) => (
              <article key={event.id} className="grid gap-4 border-b border-border/70 py-5 last:border-b-0 lg:grid-cols-[1fr_1fr_auto]">
                <div>
                  <Badge>{event.action}</Badge>
                  <p className="mt-2 text-sm font-medium">{event.actorEmail ?? "Operador eliminado"}</p>
                  <p className="font-mono text-xs text-muted-foreground">{event.actorUserId ?? "sin actor"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {event.entityType}
                    {event.entityId ? ` · ${event.entityId}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(event.createdAt)} · IP {event.ipAddress ?? "no disponible"}
                  </p>
                  {event.requestId ? <p className="mt-1 font-mono text-xs text-muted-foreground">req {event.requestId}</p> : null}
                </div>
                <details className="lg:max-w-sm">
                  <summary className="cursor-pointer text-sm font-medium text-primary">Detalle</summary>
                  <pre className="mt-2 max-w-full overflow-x-auto rounded-lg bg-secondary p-3 text-xs">
                    {JSON.stringify(event.metadata, null, 2)}
                  </pre>
                </details>
              </article>
            ))
          )}
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
