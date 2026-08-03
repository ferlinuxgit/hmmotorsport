import { ArrowRight, Check, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ContactBand } from "@/components/hm/contact-band";
import { SectionHeading } from "@/components/hm/section-heading";
import { ServiceGallery } from "@/components/hm/service-gallery";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { serviceDetails, services } from "@/lib/hm-content";

export function generateStaticParams() {
  return Object.keys(serviceDetails).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = serviceDetails[slug];
  if (!service) return {};
  const summary = services.find((item) => item.slug === slug);
  return {
    title: summary?.title ?? service.title,
    description: service.intro,
    alternates: { canonical: `/servicios/${slug}` },
    openGraph: {
      title: summary?.title ?? service.title,
      description: service.intro,
      images: [{ url: service.image, alt: service.imageAlt }]
    }
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = serviceDetails[slug];
  if (!service) notFound();

  return (
    <div className="min-h-[100dvh] bg-background">
      <SiteHeader />
      <main id="main-content">
        <section className="mx-auto grid max-w-[1440px] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-10 lg:py-24">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">{service.eyebrow}</p>
            <h1 className="mt-5 max-w-5xl text-5xl font-semibold uppercase leading-[0.86] tracking-[-0.045em] sm:text-7xl lg:text-8xl">{service.title}</h1>
            <p className="mt-7 max-w-[62ch] text-lg leading-8 text-muted-foreground">{service.intro}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={`/contacto?servicio=${service.slug}`} className="inline-flex h-12 items-center justify-center gap-3 bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5 hover:bg-primary/90 active:translate-y-0">Pedir presupuesto <ArrowRight size={18} weight="bold" aria-hidden="true" /></Link>
              <a href="#incluye" className="inline-flex h-12 items-center justify-center border border-border px-6 text-sm font-semibold transition hover:border-foreground/50 hover:bg-card">Qué incluye</a>
            </div>
          </div>
          {service.gallery ? (
            <ServiceGallery images={service.gallery} highlights={service.highlights} />
          ) : (
            <div className="relative aspect-[4/5] overflow-hidden border border-border sm:aspect-[5/4] lg:aspect-[4/5]">
              <Image src={service.image} alt={service.imageAlt} fill priority sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover" />
              <div className="absolute inset-x-0 bottom-0 grid gap-px bg-white/15 sm:grid-cols-3">
                {service.highlights.map((item) => <div key={item} className="flex items-center gap-2 bg-black/82 px-4 py-4 font-mono text-[10px] uppercase tracking-[0.12em] text-white backdrop-blur"><Check size={14} className="shrink-0 text-primary" weight="bold" aria-hidden="true" />{item}</div>)}
              </div>
            </div>
          )}
        </section>

        <section className="border-y border-border bg-card">
          <div className="mx-auto grid max-w-[1440px] gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[0.78fr_1.22fr] lg:px-10 lg:py-28">
            <div>
              <WarningCircle size={28} className="text-primary" weight="duotone" aria-hidden="true" />
              <h2 className="mt-6 text-4xl font-semibold uppercase leading-[0.95] tracking-[-0.03em] sm:text-5xl">{service.problemTitle}</h2>
              <p className="mt-5 max-w-[55ch] leading-7 text-muted-foreground">{service.problemIntro}</p>
            </div>
            <div className="grid gap-px bg-border sm:grid-cols-2">
              {service.problems.map((problem) => (
                <article key={problem.title} className="bg-card p-6 sm:p-8">
                  <h3 className="text-xl font-semibold uppercase">{problem.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{problem.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="incluye" className="mx-auto max-w-[1440px] px-4 py-24 sm:px-6 lg:px-10 lg:py-36">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.7fr] lg:items-end">
            <SectionHeading eyebrow="Alcance del servicio" title="Diseño antes de ejecutar. Validación antes de entregar." />
            <div className="border-l-2 border-primary pl-5"><h3 className="text-2xl font-semibold uppercase">{service.outcomeTitle}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{service.outcomeText}</p></div>
          </div>
          <div className="mt-16 grid border-t border-border md:grid-cols-2 xl:grid-cols-4">
            {service.includes.map((item, index) => (
              <article key={item.label} className={`border-b border-border py-7 md:px-7 ${index % 2 === 0 ? "md:border-r md:pl-0 xl:pl-7" : "md:pr-0 xl:border-r xl:pr-7"} xl:first:pl-0 xl:last:border-r-0 xl:last:pr-0`}>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">{item.label}</span>
                <h3 className="mt-8 text-2xl font-semibold uppercase">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-card">
          <div className="mx-auto grid max-w-[1440px] gap-16 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-10 lg:py-28">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Proceso de trabajo</p>
              <div className="mt-7 border-t border-border">
                {service.process.map((step, index) => <div key={step} className="grid grid-cols-[42px_1fr] border-b border-border py-5"><span className="font-mono text-xs text-primary">0{index + 1}</span><p className="font-medium">{step}</p></div>)}
              </div>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Para presupuestar</p>
              <h2 className="mt-5 text-4xl font-semibold uppercase leading-none">Necesitamos una base clara.</h2>
              <p className="mt-4 max-w-[55ch] text-sm leading-6 text-muted-foreground">Con esta información podemos valorar alcance, coste y plazos sin hacerte perder tiempo.</p>
              <ul className="mt-7 grid gap-3">
                {service.requirements.map((item) => <li key={item} className="flex items-start gap-3 border-b border-border pb-3 text-sm"><Check size={17} className="mt-0.5 shrink-0 text-primary" weight="bold" aria-hidden="true" />{item}</li>)}
              </ul>
              <Link href={`/contacto?servicio=${service.slug}`} className="mt-8 inline-flex items-center gap-3 text-sm font-semibold text-primary transition hover:gap-4">Enviar información <ArrowRight size={18} weight="bold" aria-hidden="true" /></Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-4 py-24 sm:px-6 lg:px-10 lg:py-32">
          <SectionHeading eyebrow="Preguntas frecuentes" title="Antes de empezar." />
          <div className="mt-14 grid gap-x-14 gap-y-0 border-t border-border md:grid-cols-2">
            {service.faqs.map((faq) => <article key={faq.question} className="border-b border-border py-7"><h3 className="text-xl font-semibold uppercase">{faq.question}</h3><p className="mt-3 max-w-[58ch] text-sm leading-6 text-muted-foreground">{faq.answer}</p></article>)}
          </div>
        </section>

        <ContactBand title="Danos el punto de partida. Nosotros ordenamos el proyecto." text="Incluye coche, uso, componentes o modificaciones actuales y el resultado que buscas. Te responderemos con una valoración inicial." />
      </main>
      <SiteFooter />
    </div>
  );
}
