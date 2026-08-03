import type { Metadata } from "next";
import Link from "next/link";

import { ContentCreateForm } from "@/components/admin/content-editor";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listContentPages, parseContentPageQuery } from "@/lib/content/admin";

export const metadata: Metadata = { title: "Contenido | Backoffice", robots: { index: false, follow: false } };
type SearchParams = Record<string, string | string[] | undefined>;
function toParams(input: SearchParams) { const value = new URLSearchParams(); for (const [key, item] of Object.entries(input)) if (typeof item === "string") value.set(key, item); return value; }

export default async function AdminContentPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const raw = await searchParams;
  let query: ReturnType<typeof parseContentPageQuery>; try { query = parseContentPageQuery(toParams(raw)); } catch { query = parseContentPageQuery(new URLSearchParams()); }
  const result = await listContentPages(query);
  return <main id="main-content" className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 sm:py-14"><div className="space-y-3"><p className="font-mono text-xs uppercase tracking-[0.14em] text-primary">Editorial</p><h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Contenido</h1><p className="max-w-3xl text-sm text-muted-foreground">Páginas seguras con borrador, publicación, archivado, SEO y control optimista de edición.</p></div><Card><CardHeader><CardTitle>Nueva página</CardTitle><CardDescription>Crea el registro y continúa en el editor completo.</CardDescription></CardHeader><CardContent><ContentCreateForm /></CardContent></Card><Card><CardHeader><CardTitle>Filtros</CardTitle></CardHeader><CardContent><form method="get" className="grid gap-3 md:grid-cols-[1fr_180px_auto]"><Input name="q" defaultValue={query.q} placeholder="Título o slug" /><select name="status" defaultValue={query.status} className="h-11 rounded-lg border border-input bg-background px-3 text-sm"><option value="all">Todos</option><option value="draft">Borradores</option><option value="published">Publicados</option><option value="archived">Archivados</option></select><Button type="submit">Aplicar</Button></form></CardContent></Card><Card><CardHeader><CardTitle>{result.pagination.total} páginas</CardTitle></CardHeader><CardContent><div className="divide-y divide-border/70">{result.items.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">No hay páginas.</p> : result.items.map((page) => <Link key={page.id} href={`/admin/content/${page.id}`} className="flex flex-wrap items-center justify-between gap-4 py-5 hover:text-primary"><div><p className="font-medium">{page.title}</p><p className="font-mono text-xs text-muted-foreground">/pages/{page.slug} · v{page.version}</p></div><div className="flex items-center gap-2"><Badge variant={page.status === "published" ? "default" : "secondary"}>{page.status}</Badge><span className="text-xs text-muted-foreground">{new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(page.updatedAt)}</span></div></Link>)}</div></CardContent></Card><AdminPagination basePath="/admin/content" page={result.pagination.page} pages={result.pagination.pages} searchParams={raw} /></main>;
}
