import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh]">
      <SiteHeader />
      <main id="main-content" className="mx-auto flex min-h-[65dvh] max-w-4xl items-center px-4 py-16 text-center sm:px-6">
        <div className="w-full">
          <p className="font-mono text-sm text-primary">404</p>
          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">Esta ruta no forma parte del sistema.</h1>
          <p className="mx-auto mt-5 max-w-xl leading-7 text-muted-foreground">Vuelve al inicio o abre el dashboard para continuar desde una superficie conocida.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild><Link href="/"><ArrowLeft size={18} weight="bold" aria-hidden="true" />Volver al inicio</Link></Button>
            <Button variant="outline" asChild><Link href="/dashboard">Abrir dashboard</Link></Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
