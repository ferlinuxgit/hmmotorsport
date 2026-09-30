import { Envelope, InstagramLogo, MapPin, Phone } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

import { ContactForm } from "@/components/hm/contact-form";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { contact } from "@/lib/hm-content";
import { pageMetadata } from "@/lib/seo";

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ servicio?: string }> }) {
  const { servicio = "" } = await searchParams;
  return (
    <div className="min-h-[100dvh] bg-background">
      <SiteHeader />
      <main id="main-content">
        <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-10 lg:py-28">
          <div className="grid gap-14 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
            <div className="lg:sticky lg:top-36">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent">Contacto</p>
              <h1 className="mt-5 text-5xl font-semibold uppercase leading-[0.88] tracking-[-0.04em] sm:text-7xl">Cuéntanos tu proyecto.</h1>
              <p className="mt-6 max-w-[52ch] text-base leading-7 text-muted-foreground">Para orientarte necesitamos lo esencial: coche, uso, objetivo y modificaciones actuales. Cuanto más preciso sea el punto de partida, mejor será la respuesta.</p>
              <div className="mt-10 grid border-t border-border">
                <a href={`tel:+${contact.electronics.phone}`} className="flex items-center gap-4 border-b border-border py-5 transition hover:text-primary"><Phone size={21} className="text-primary" weight="fill" aria-hidden="true" /><span><strong className="block text-sm">Electrónica</strong><span className="text-sm text-muted-foreground">{contact.electronics.display}</span></span></a>
                <a href={`tel:+${contact.mechanics.phone}`} className="flex items-center gap-4 border-b border-border py-5 transition hover:text-primary"><Phone size={21} className="text-primary" weight="fill" aria-hidden="true" /><span><strong className="block text-sm">Mecánica</strong><span className="text-sm text-muted-foreground">{contact.mechanics.display}</span></span></a>
                <a href={`mailto:${contact.email}`} className="flex items-center gap-4 border-b border-border py-5 transition hover:text-primary"><Envelope size={21} className="text-primary" weight="fill" aria-hidden="true" /><span className="text-sm">{contact.email}</span></a>
                <a href={contact.maps} target="_blank" rel="noreferrer" className="flex items-center gap-4 border-b border-border py-5 transition hover:text-primary"><MapPin size={21} className="text-primary" weight="fill" aria-hidden="true" /><span className="text-sm leading-5">{contact.address}</span></a>
                <a href={contact.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-4 border-b border-border py-5 transition hover:text-primary"><InstagramLogo size={21} className="text-primary" weight="fill" aria-hidden="true" /><span className="text-sm">@hmmotorsport.es</span></a>
              </div>
            </div>
            <div>
              <div className="mb-6 flex items-center justify-between gap-5 border-b border-border pb-5">
                <div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">Solicitud inicial</p><h2 className="mt-2 text-3xl font-semibold uppercase">Datos del proyecto</h2></div>
                <p className="hidden text-right font-mono text-[10px] uppercase leading-5 text-muted-foreground sm:block">Respuesta habitual<br />24—48 h</p>
              </div>
              <ContactForm initialService={servicio} />
              <p className="mt-4 text-xs leading-5 text-muted-foreground">El formulario prepara un mensaje en WhatsApp; podrás revisarlo antes de enviarlo. Para archivos, fotos o logs, adjúntalos directamente en la conversación.</p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

export const metadata: Metadata = pageMetadata({
  title: "Contacto y presupuesto",
  description: "Solicita asesoramiento para tu proyecto de electrónica, mecánica o preparación motorsport en HM Motorsport, Albatera (Alicante). Electrónica 622 32 38 78 · Mecánica 666 05 25 11.",
  path: "/contacto"
});
