import type { Metadata } from "next";

import { JobActions } from "@/components/admin/job-actions";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listJobs, parseJobQuery } from "@/lib/jobs/queue";

export const metadata: Metadata = { title: "Jobs | Backoffice", robots: { index: false, follow: false } };
type SearchParams = Record<string, string | string[] | undefined>;
function toParams(input: SearchParams) { const value = new URLSearchParams(); for (const [key, item] of Object.entries(input)) if (typeof item === "string") value.set(key, item); return value; }
function date(value: Date | null) { return value ? new Intl.DateTimeFormat("es", { dateStyle: "short", timeStyle: "medium" }).format(value) : "—"; }

export default async function AdminJobsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const raw = await searchParams;
  let query: ReturnType<typeof parseJobQuery>;
  try { query = parseJobQuery(toParams(raw)); } catch { query = parseJobQuery(new URLSearchParams()); }
  const result = await listJobs(query);
  return <main id="main-content" className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 sm:py-14">
    <div className="space-y-3"><p className="font-mono text-xs uppercase tracking-[0.14em] text-primary">Operación asíncrona</p><h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Jobs</h1><p className="max-w-3xl text-sm text-muted-foreground">Cola PostgreSQL con locks, SKIP LOCKED, backoff exponencial, deduplicación e historial de intentos.</p></div>
    <Card><CardHeader><CardTitle>Filtros</CardTitle><CardDescription>Busca por tipo o clave de deduplicación.</CardDescription></CardHeader><CardContent><form method="get" className="grid gap-3 md:grid-cols-[1fr_180px_auto]"><Input name="q" defaultValue={query.q} placeholder="Tipo o deduplication key" /><select name="status" defaultValue={query.status} className="h-11 rounded-lg border border-input bg-background px-3 text-sm"><option value="all">Todos</option><option value="queued">Queued</option><option value="running">Running</option><option value="succeeded">Succeeded</option><option value="failed">Failed</option><option value="cancelled">Cancelled</option></select><Button type="submit">Aplicar</Button></form></CardContent></Card>
    <Card><CardHeader><CardTitle>{result.pagination.total} jobs</CardTitle><CardDescription>La ejecución se activa con `npm run jobs:run` o invocando el endpoint interno desde un scheduler.</CardDescription></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="border-b text-xs uppercase text-muted-foreground"><tr><th className="py-3 pr-4">Job</th><th className="py-3 pr-4">Estado</th><th className="py-3 pr-4">Intentos</th><th className="py-3 pr-4">Programación</th><th className="py-3">Acción</th></tr></thead><tbody>{result.items.length === 0 ? <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">No hay jobs.</td></tr> : result.items.map((job) => <tr key={job.id} className="border-b border-border/70 align-top"><td className="py-4 pr-4"><p className="font-medium">{job.type}</p><p className="font-mono text-xs text-muted-foreground">{job.id}</p>{job.lastError ? <details className="mt-2 max-w-lg"><summary className="cursor-pointer text-xs text-destructive">Último error</summary><pre className="mt-1 whitespace-pre-wrap text-xs">{job.lastError}</pre></details> : null}</td><td className="py-4 pr-4"><Badge variant={job.status === "succeeded" ? "default" : job.status === "failed" ? "outline" : "secondary"}>{job.status}</Badge></td><td className="py-4 pr-4">{job.attempts}/{job.maxAttempts}</td><td className="py-4 pr-4"><p>{date(job.runAt)}</p><p className="text-xs text-muted-foreground">Fin {date(job.completedAt)}</p></td><td className="py-4"><JobActions jobId={job.id} status={job.status} /></td></tr>)}</tbody></table></CardContent></Card>
    <AdminPagination basePath="/admin/jobs" page={result.pagination.page} pages={result.pagination.pages} searchParams={raw} />
  </main>;
}
