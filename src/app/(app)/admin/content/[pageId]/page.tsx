import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { ContentEditor } from "@/components/admin/content-editor";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getContentPage } from "@/lib/content/admin";

export const metadata: Metadata = { title: "Editar contenido | Backoffice", robots: { index: false, follow: false } };

export default async function AdminContentDetailPage({ params }: { params: Promise<{ pageId: string }> }) {
  const parsed = z.uuid().safeParse((await params).pageId); if (!parsed.success) notFound();
  const page = await getContentPage(parsed.data).catch(() => notFound());
  return <main id="main-content" className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6 sm:py-14"><div><Link href="/admin/content" className="text-sm text-muted-foreground hover:text-foreground">← Contenido</Link><div className="mt-5 flex flex-wrap items-center gap-3"><h1 className="text-4xl font-semibold tracking-[-0.04em]">{page.title}</h1><Badge variant={page.status === "published" ? "default" : "secondary"}>{page.status}</Badge></div><p className="mt-2 font-mono text-xs text-muted-foreground">/pages/{page.slug} · versión {page.version}</p></div><Card><CardHeader><CardTitle>Editor</CardTitle><CardDescription>El cuerpo se muestra como texto estructurado seguro; una extensión puede sustituir el renderer por Markdown o bloques.</CardDescription></CardHeader><CardContent><ContentEditor page={page} /></CardContent></Card></main>;
}
