import { ArrowRight, CheckCircle, Crosshair, Wrench } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ContactBand } from "@/components/hm/contact-band";
import { SectionHeading } from "@/components/hm/section-heading";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { pageMetadata } from "@/lib/seo";

const values = [
  ["Orden", "Cableado, routing y montaje pensados para revisar y mantener."],
  ["Fiabilidad", "Control térmico, márgenes de seguridad y piezas con una función clara."],
  ["Datos", "Decisiones respaldadas por registros y validación, no solo sensaciones."],
  ["Transparencia", "Te explicamos el porqué de cada fase y cuándo algo no aporta."]
] as const;

export default function AboutPage() {
  return (
    <div className="min-h-[100dvh] bg-background">
      <SiteHeader />
      <main id="main-content">
        <section className="mx-auto grid max-w-[1440px] gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-10 lg:py-28">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent">Quiénes somos</p>
            <h1 className="mt-5 max-w-5xl text-5xl font-semibold uppercase leading-[0.86] tracking-[-0.045em] sm:text-7xl lg:text-8xl">Ingeniería, método y obsesión por el detalle.</h1>
            <p className="mt-7 max-w-[60ch] text-lg leading-8 text-muted-foreground">No hacemos preparaciones por moda. Partimos de un objetivo, ordenamos prioridades, ejecutamos con limpieza y validamos el resultado.</p>
            <Link href="/contacto" className="mt-8 inline-flex items-center gap-3 text-sm font-semibold text-accent transition hover:gap-4">Conocer nuestro enfoque para tu coche <ArrowRight size={18} weight="bold" aria-hidden="true" /></Link>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden border border-border sm:aspect-[5/4] lg:aspect-[4/5]">
            <Image src="/images/hm/hero-workshop.jpg" alt="Motor de altas prestaciones preparado por HM Motorsport" fill preload fetchPriority="high" quality={50} sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover" />
            <div className="absolute inset-0 bg-black/15" />
            <div className="absolute bottom-0 left-0 border-r border-t border-white/20 bg-black/85 p-5 text-white backdrop-blur-sm sm:p-7">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">Street · Track · Competición</p>
              <p className="mt-3 max-w-xs text-lg font-semibold uppercase">Si una mejora no aporta, te lo decimos.</p>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-card">
          <div className="mx-auto grid max-w-[1440px] gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-10 lg:py-28">
            <SectionHeading eyebrow="Principios de trabajo" title="Rápido y fiable no son objetivos opuestos." />
            <div className="grid gap-px bg-border sm:grid-cols-2">
              {values.map(([title, text], index) => (
                <article key={title} className="bg-card p-6 sm:p-8">
                  {index === 0 ? <Wrench size={24} className="text-primary" weight="duotone" aria-hidden="true" /> : index === 1 ? <CheckCircle size={24} className="text-primary" weight="duotone" aria-hidden="true" /> : <Crosshair size={24} className="text-primary" weight="duotone" aria-hidden="true" />}
                  <h3 className="mt-8 text-2xl font-semibold uppercase">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-4 py-24 sm:px-6 lg:px-10 lg:py-36">
          <SectionHeading eyebrow="Proceso" title="Un proyecto serio se construye por fases."><p>Así evitamos gastar donde no toca y dejamos margen para evolucionar sin rehacer lo anterior.</p></SectionHeading>
          <div className="mt-14 grid border-t border-border lg:grid-cols-5">
            {["Brief", "Diagnóstico", "Plan", "Ejecución", "Validación"].map((step, index) => (
              <div key={step} className="border-b border-border py-6 lg:border-r lg:px-6 lg:first:pl-0 lg:last:border-r-0">
                <span className="font-mono text-xs text-accent">0{index + 1}</span>
                <h3 className="mt-6 text-xl font-semibold uppercase">{step}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{[
                  "Uso, objetivo, presupuesto y plazos.",
                  "Estado real y limitaciones de la base.",
                  "Imprescindible, rendimiento y extras.",
                  "Montaje limpio y checklist de control.",
                  "Datos, temperaturas y consistencia."
                ][index]}</p>
              </div>
            ))}
          </div>
        </section>

        <ContactBand title="Un buen proyecto empieza con una conversación clara." text="Cuéntanos qué tienes, cómo usas el coche y cuál es el resultado que buscas. Nosotros ordenamos el resto." />
      </main>
      <SiteFooter />
    </div>
  );
}

export const metadata: Metadata = pageMetadata({
  title: "Quiénes somos",
  description: "Conoce HM Motorsport, taller de preparación en Albatera (Alicante): método, fiabilidad, datos y transparencia técnica en cada proyecto.",
  path: "/quienes-somos"
});
