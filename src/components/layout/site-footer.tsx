import Link from "next/link";

import { getInstalledModules } from "@/lib/modules/loader";
import { siteConfig } from "@/lib/config/site";

export function SiteFooter() {
  const modules = getInstalledModules();

  return (
    <footer className="mt-24 border-t border-border/70 bg-card/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-[1.4fr_0.6fr_0.6fr]">
        <div className="space-y-3">
          <p className="font-semibold">{siteConfig.name}</p>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            Foundation modular para construir marketing sites, comercio y SaaS sobre un núcleo común y verificable.
          </p>
          <p className="font-mono text-xs text-muted-foreground">{modules.length} módulos activos en src/extensions</p>
        </div>
        <div className="grid content-start gap-2 text-sm">
          <p className="mb-1 font-semibold">Producto</p>
          <Link className="text-muted-foreground hover:text-foreground" href="/#stack">Stack</Link>
          <Link className="text-muted-foreground hover:text-foreground" href="/#modules">Módulos</Link>
          <Link className="text-muted-foreground hover:text-foreground" href="/dashboard">Dashboard</Link>
        </div>
        <div className="grid content-start gap-2 text-sm">
          <p className="mb-1 font-semibold">Legal</p>
          <Link className="text-muted-foreground hover:text-foreground" href="/privacy">Privacidad</Link>
          <Link className="text-muted-foreground hover:text-foreground" href="/terms">Términos</Link>
        </div>
      </div>
      <div className="border-t border-border/70 px-6 py-5 text-center text-xs text-muted-foreground">
        Base técnica reutilizable. Adapta la información legal y operativa antes de publicar un producto final.
      </div>
    </footer>
  );
}
