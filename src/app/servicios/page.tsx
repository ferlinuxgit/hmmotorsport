import type { Metadata } from "next";

import { ContactBand } from "@/components/hm/contact-band";
import { SectionHeading } from "@/components/hm/section-heading";
import { ServiceList } from "@/components/hm/service-list";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { pageMetadata } from "@/lib/seo";

export default function ServicesPage() {
  return (
    <div className="min-h-[100dvh] bg-background">
      <SiteHeader />
      <main id="main-content">
        <section className="border-b border-border">
          <div className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 lg:px-10 lg:py-32">
            <div className="grid gap-10 lg:grid-cols-[1fr_0.65fr] lg:items-end">
              <SectionHeading eyebrow="Servicios HM Motorsport" title="Un solo taller. Todo el coche entendido como un sistema." />
              <p className="max-w-[58ch] text-base leading-7 text-muted-foreground lg:justify-self-end">No vendemos paquetes cerrados. Revisamos la base, definimos prioridades y planteamos cada trabajo según el uso real del vehículo.</p>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-10 lg:py-24"><ServiceList /></section>
        <ContactBand title="¿No sabes qué servicio necesitas? Empecemos por el objetivo." text="Descríbenos el coche, las modificaciones actuales y el uso. Te diremos qué revisar primero y cómo ordenar el proyecto." />
      </main>
      <SiteFooter />
    </div>
  );
}

export const metadata: Metadata = pageMetadata({
  title: "Servicios de preparación y electrónica motorsport",
  description: "Calibración ECU, banco de potencia, cableado motorsport, preparación mecánica, fabricación TIG, jaulas antivuelco y asistencia en carreras en Albatera, Alicante.",
  path: "/servicios"
});
