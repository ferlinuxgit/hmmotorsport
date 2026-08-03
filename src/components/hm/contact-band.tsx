import { ArrowRight, Phone } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { contact } from "@/lib/hm-content";

export function ContactBand({
  title = "Cuéntanos qué coche tienes y qué quieres conseguir.",
  text = "Revisamos la base, el uso y las prioridades antes de proponerte trabajo o piezas."
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section className="border-y border-primary/35 bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-end lg:px-10 lg:py-16">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary-foreground/65">Hablemos de tu proyecto</p>
          <h2 className="mt-4 max-w-4xl text-4xl font-semibold uppercase leading-[0.94] tracking-[-0.035em] text-balance sm:text-5xl lg:text-6xl">{title}</h2>
          <p className="mt-5 max-w-[62ch] leading-7 text-primary-foreground/75">{text}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <Link href="/contacto" className="inline-flex h-12 items-center justify-center gap-3 bg-white px-6 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:translate-y-0">
            Solicitar asesoramiento <ArrowRight size={18} weight="bold" aria-hidden="true" />
          </Link>
          <a href={`tel:+${contact.electronics.phone}`} className="inline-flex h-12 items-center justify-center gap-3 border border-white/35 px-6 text-sm font-semibold transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <Phone size={18} weight="bold" aria-hidden="true" /> {contact.electronics.display}
          </a>
        </div>
      </div>
    </section>
  );
}
