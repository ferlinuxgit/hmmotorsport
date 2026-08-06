import { ArrowDown, ArrowRight, Check, Gauge, Wrench } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ContactBand } from "@/components/hm/contact-band";
import { SectionHeading } from "@/components/hm/section-heading";
import { ServiceList } from "@/components/hm/service-list";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

const workBases = [
  ["01", "Revisión inicial", "Objetivo, configuración y estado real del coche."],
  ["02", "Prioridades", "Un plan por fases para no gastar donde no aporta."],
  ["03", "Ejecución limpia", "Montajes accesibles, ordenados y fáciles de mantener."],
  ["04", "Validación", "Resultados medibles, temperaturas controladas y consistencia."]
] as const;

export default function HomePage() {
  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-background">
      <SiteHeader />
      <main id="main-content">
        <section className="relative isolate min-h-[calc(100dvh-76px)] overflow-hidden border-b border-border lg:min-h-[calc(100dvh-118px)]">
          <Image src="/images/hm/hero-workshop.jpg" alt="Motor preparado por HM Motorsport" fill preload fetchPriority="high" quality={50} sizes="100vw" className="-z-20 object-cover object-center" />
          <div className="absolute inset-0 -z-10 bg-black/60" />
          <div className="hm-grid absolute inset-0 -z-10 opacity-30" />
          <div className="mx-auto flex min-h-[calc(100dvh-76px)] max-w-[1440px] flex-col justify-between px-4 py-10 sm:px-6 sm:py-14 lg:min-h-[calc(100dvh-118px)] lg:px-10 lg:py-16">
            <div className="grid gap-10 lg:grid-cols-[1fr_320px] lg:items-start">
              <div>
                <p className="inline-flex items-center gap-3 font-mono text-[11px] font-medium uppercase tracking-[0.24em] text-white/70"><span className="h-px w-10 bg-primary" /> Street · Track · Competición</p>
                <h1 className="mt-7 max-w-6xl text-[clamp(3.65rem,9vw,8.5rem)] font-semibold uppercase leading-[0.78] tracking-[-0.055em] text-white text-balance">
                  Electrónica<br />y mecánica <span className="text-accent">de alto rendimiento.</span>
                </h1>
                <p className="mt-8 max-w-[58ch] text-base leading-7 text-white/72 sm:text-lg">Cada proyecto se plantea según el coche, su uso y el objetivo real. Sin recetas universales. Sin piezas porque sí.</p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href="/contacto" prefetch={false} className="inline-flex h-12 items-center justify-center gap-3 bg-primary px-6 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:translate-y-0">Solicitar asesoramiento <ArrowRight size={18} weight="bold" aria-hidden="true" /></Link>
                  <Link href="#servicios" className="inline-flex h-12 items-center justify-center gap-3 border border-white/30 bg-black/20 px-6 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/55 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Ver servicios <ArrowDown size={18} weight="bold" aria-hidden="true" /></Link>
                </div>
              </div>

              <aside className="hidden border-l border-white/20 pl-7 lg:block">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">Nuestra forma de trabajar</p>
                <p className="mt-5 text-2xl font-semibold uppercase leading-tight text-white">Más potencia no siempre significa ir más rápido.</p>
                <p className="mt-4 text-sm leading-6 text-white/60">La diferencia está en controlar temperaturas, entregar el par donde sirve y repetir el resultado.</p>
              </aside>
            </div>

            <div className="mt-14 grid border-y border-white/18 sm:grid-cols-3">
              {["Mecánica deportiva", "Electrónica y datos", "Asistencia en pista"].map((item, index) => (
                <div key={item} className={`flex items-center gap-3 py-4 text-xs font-medium uppercase tracking-[0.1em] text-white/72 ${index > 0 ? "border-t border-white/18 sm:border-l sm:border-t-0 sm:px-6" : "sm:pr-6"}`}>
                  <Check size={16} className="shrink-0 text-primary" weight="bold" aria-hidden="true" />{item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="servicios" className="mx-auto max-w-[1440px] px-4 py-24 sm:px-6 lg:px-10 lg:py-36">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.7fr] lg:items-end">
            <SectionHeading eyebrow="Capacidades del taller" title="Servicios con una misma lógica: rendimiento que aguanta." />
            <p className="max-w-[58ch] text-base leading-7 text-muted-foreground lg:justify-self-end">Desde la arquitectura eléctrica hasta la mecánica y la validación en pista. Todo se plantea como parte del mismo sistema.</p>
          </div>
          <div className="mt-14 lg:mt-20"><ServiceList compact /></div>
        </section>

        <section className="border-y border-border bg-card">
          <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[0.92fr_1.08fr]">
            <div className="relative min-h-[420px] overflow-hidden lg:min-h-[720px]">
              <Image src="/images/hm/asistencia-pista.jpg" alt="Asistencia técnica de HM Motorsport en circuito" fill quality={50} sizes="(max-width: 1024px) 100vw, 46vw" className="object-cover" />
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute bottom-5 left-5 bg-black/80 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-white backdrop-blur sm:bottom-8 sm:left-8">Pista · diagnóstico · consistencia</div>
            </div>
            <div className="flex flex-col justify-center px-4 py-16 sm:px-8 lg:px-16 lg:py-24">
              <SectionHeading eyebrow="Método HM" title="Una preparación seria empieza por la base." />
              <p className="mt-6 max-w-[60ch] text-base leading-7 text-muted-foreground">La experiencia sirve para saber dónde mirar primero. Revisamos, priorizamos y validamos antes de dar por terminado cualquier trabajo.</p>
              <div className="mt-10 border-t border-border">
                {workBases.map(([number, title, text]) => (
                  <div key={number} className="grid grid-cols-[44px_1fr] gap-4 border-b border-border py-5 sm:grid-cols-[58px_170px_1fr] sm:gap-5">
                    <span className="font-mono text-xs text-accent">{number}</span>
                    <h3 className="text-lg font-semibold uppercase leading-none">{title}</h3>
                    <p className="col-start-2 text-sm leading-6 text-muted-foreground sm:col-start-auto">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1440px] gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-10 lg:py-36">
          <div>
            <div className="flex size-12 items-center justify-center border border-primary/40 text-primary"><Gauge size={25} weight="duotone" aria-hidden="true" /></div>
            <h2 className="mt-7 text-4xl font-semibold uppercase leading-[0.95] tracking-[-0.035em] sm:text-5xl">El número de banco es solo una parte.</h2>
          </div>
          <div className="lg:pt-20">
            <p className="max-w-[62ch] text-xl leading-8 text-foreground/85">Un coche eficaz mantiene temperaturas, responde de forma predecible y permite al conductor usar lo que tiene durante más de una vuelta.</p>
            <div className="mt-10 grid gap-px bg-border sm:grid-cols-2">
              <div className="bg-background p-6"><Wrench size={22} className="text-primary" weight="duotone" aria-hidden="true" /><h3 className="mt-5 text-xl font-semibold uppercase">Mantenible</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">Acceso, orden y documentación para que cada revisión sea más rápida.</p></div>
              <div className="bg-background p-6"><Gauge size={22} className="text-primary" weight="duotone" aria-hidden="true" /><h3 className="mt-5 text-xl font-semibold uppercase">Medible</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">Decisiones basadas en señales, temperaturas y comportamiento bajo carga.</p></div>
            </div>
          </div>
        </section>

        <ContactBand />
      </main>
      <SiteFooter />
    </div>
  );
}

export const metadata: Metadata = {
  title: "HM Motorsport | Electrónica y mecánica de alto rendimiento",
  description: "Preparación de vehículos, calibración ECU, cableado motorsport, banco de potencia, fabricación y asistencia en pista en Albatera, Alicante.",
  alternates: { canonical: "/" }
};
