import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";

import { SiteHeader } from "@/components/layout/site-header";

const assurances = [
  "Sesiones seguras gestionadas por Better Auth",
  "Redirecciones internas validadas en servidor",
  "Cuenta sincronizada con roles y estado operativo"
];

export function AuthShell({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="min-h-[100dvh]">
      <SiteHeader />
      <main id="main-content" className="mx-auto grid min-h-[calc(100dvh-72px)] max-w-7xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
        <section className="max-w-xl">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-primary">Acceso al workspace</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{title}</h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">{description}</p>
          <ul className="mt-8 space-y-3">
            {assurances.map((assurance) => (
              <li key={assurance} className="flex items-start gap-3 text-sm text-muted-foreground">
                <CheckCircle size={18} weight="fill" className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                {assurance}
              </li>
            ))}
          </ul>
        </section>
        <div className="w-full max-w-xl lg:ml-auto">{children}</div>
      </main>
    </div>
  );
}
