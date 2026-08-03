import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPublishedContentPage } from "@/lib/content/admin";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const page = await getPublishedContentPage((await params).slug);
  if (!page) return { title: "Página no encontrada", robots: { index: false, follow: false } };
  return { title: page.seoTitle ?? page.title, description: page.seoDescription ?? page.summary ?? undefined };
}

export default async function PublicContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const page = await getPublishedContentPage((await params).slug); if (!page) notFound();
  const paragraphs = page.body.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
  return <main id="main-content" className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-28"><article><p className="font-mono text-xs uppercase tracking-[0.14em] text-primary">Contenido</p><h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">{page.title}</h1>{page.summary ? <p className="mt-6 text-lg leading-8 text-muted-foreground">{page.summary}</p> : null}<div className="mt-12 space-y-6 text-base leading-8 text-foreground/90">{paragraphs.map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 20)}`} className="whitespace-pre-wrap">{paragraph}</p>)}</div></article></main>;
}
