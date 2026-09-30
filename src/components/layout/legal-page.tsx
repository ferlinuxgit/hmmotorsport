import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export function LegalPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <div className="min-h-[100dvh]">
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-accent">Información legal</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{title}</h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">{intro}</p>
        <div className="mt-12 space-y-10 border-t border-border/80 pt-10 text-sm leading-7 text-muted-foreground">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
