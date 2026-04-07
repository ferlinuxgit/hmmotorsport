import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getEnabledPaymentProviders, getInstalledModules } from "@/lib/modules/loader";

export function Hero() {
  const modules = getInstalledModules();
  const providers = getEnabledPaymentProviders();

  return (
    <section className="grid gap-10 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-24">
      <div className="space-y-8">
        <Badge>Next.js + Drizzle + Payments</Badge>
        <div className="space-y-5">
          <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.04em] text-balance sm:text-6xl">
            Una base universal para lanzar productos sin rehacer la arquitectura.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            Estructura preparada para marketing sites, tiendas online y SaaS con módulos auto-registrados, PostgreSQL,
            Drizzle ORM y checkout desacoplado para Stripe y PayPal.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" asChild>
            <Link href="/dashboard">Ver dashboard</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="#modules">Ver módulos</Link>
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-border/70 bg-card/90">
        <CardHeader>
          <Badge variant="secondary">Core summary</Badge>
          <CardTitle>Arquitectura preparada para crecer</CardTitle>
          <CardDescription>
            El core se mantiene estable y la expansión ocurre agregando módulos en <code>src/extensions</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-secondary p-4">
            <p className="text-3xl font-semibold">{modules.length}</p>
            <p className="mt-2 text-sm text-muted-foreground">módulos de ejemplo instalados</p>
          </div>
          <div className="rounded-2xl bg-secondary p-4">
            <p className="text-3xl font-semibold">{providers.join(" + ")}</p>
            <p className="mt-2 text-sm text-muted-foreground">proveedores de pago activos</p>
          </div>
          <div className="rounded-2xl bg-secondary p-4 sm:col-span-2">
            <p className="font-semibold">Sin tocar el core</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Nuevas verticales, menús, secciones y capacidades se montan agregando archivos de módulo y ejecutando
              <code> npm run modules:sync</code>.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

