import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Hero } from "@/components/marketing/hero";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getInstalledModules, getMarketingSections } from "@/lib/modules/loader";

export default function HomePage() {
  const modules = getInstalledModules();
  const sections = getMarketingSections();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <div className="mx-auto max-w-7xl px-6">
          <Hero />

          <section id="stack" className="grid gap-4 py-12 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Frontend", "Next.js App Router, Tailwind y componentes estilo shadcn."],
              ["Backend", "Route handlers, servicios desacoplados y configuración centralizada."],
              ["Data", "PostgreSQL + Drizzle con esquemas listos para contenido, comercio y workspaces."],
              ["Payments", "Abstracción única para Stripe y PayPal con fallback de desarrollo."]
            ].map(([title, description]) => (
              <Card key={title} className="bg-card/80">
                <CardHeader>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </section>

          <section id="modules" className="space-y-6 py-12">
            <div className="space-y-3">
              <Badge variant="secondary">Installed modules</Badge>
              <h2 className="text-3xl font-semibold tracking-[-0.03em]">Verticales listas para reutilizar</h2>
              <p className="max-w-2xl text-muted-foreground">
                El boilerplate se entrega con módulos base para marketing, comercio y SaaS. Puedes añadir otros sin tocar
                el core.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {modules.map((module) => (
                <Card key={module.key}>
                  <CardHeader>
                    <CardTitle>{module.name}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>Área: {module.area}</p>
                    <p>Tablas: {module.dbTables.join(", ")}</p>
                    <p>Pagos: {module.paymentProviders.join(", ") || "none"}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="grid-surface rounded-[2rem] border border-border/70 px-6 py-12">
            <div className="max-w-3xl space-y-4">
              <Badge>Composable content</Badge>
              <h2 className="text-3xl font-semibold tracking-[-0.03em]">Secciones renderizadas desde módulos</h2>
            </div>
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {sections.map((section) => (
                <Card key={section.key} className="bg-background/80">
                  <CardHeader>
                    <CardDescription>{section.eyebrow}</CardDescription>
                    <CardTitle>{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

