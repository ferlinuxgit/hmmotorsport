import { ArrowUpRight, Envelope, InstagramLogo, MapPin, Phone } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";

import { contact, getServiceHref, hmNavigation, services } from "@/lib/hm-content";

const legalNavigation = [
  { title: "Privacidad", href: "/privacy" },
  { title: "Aviso legal", href: "/terms" }
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-[#080808] text-foreground">
      <div className="border-b border-border">
        <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-end lg:px-10 lg:py-16">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Tu proyecto empieza aquí</p>
            <h2 className="mt-4 max-w-4xl text-4xl font-semibold uppercase leading-[0.92] tracking-[-0.035em] text-balance sm:text-5xl lg:text-6xl">
              Cuéntanos qué quieres mejorar. Ordenaremos el camino para llegar.
            </h2>
          </div>
          <Link
            href="/contacto"
            className="inline-flex h-12 w-fit items-center justify-center gap-3 bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#080808] active:translate-y-0"
          >
            Solicitar valoración <ArrowUpRight size={18} weight="bold" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1440px] gap-12 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-[0.9fr_1.15fr_0.95fr] lg:px-10 lg:py-20">
        <div>
          <Link href="/" className="inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Ir al inicio de HM Motorsport">
            <Image src="/images/hm/logo-horizontal.png" alt="HM Motorsport" width={300} height={44} className="h-auto w-[240px]" />
          </Link>
          <p className="mt-6 max-w-sm text-sm leading-6 text-muted-foreground">
            Electrónica, mecánica y fabricación para coches de calle, tandas y competición. Cada proyecto se plantea para rendir, durar y poder mantenerse.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={contact.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 border border-border px-4 text-xs font-semibold transition hover:border-foreground/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <InstagramLogo size={17} weight="fill" aria-hidden="true" /> Instagram
            </a>
            <a
              href={contact.maps}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 border border-border px-4 text-xs font-semibold transition hover:border-foreground/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <MapPin size={17} weight="fill" aria-hidden="true" /> Cómo llegar
            </a>
          </div>
        </div>

        <nav aria-label="Servicios en el pie de página">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Servicios</p>
          <ul className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {services.map((service) => (
              <li key={service.slug}>
                <Link
                  className="group inline-flex items-start gap-2 text-sm leading-5 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={getServiceHref(service)}
                >
                  <span className="mt-[0.55rem] size-1 shrink-0 bg-primary transition-transform group-hover:scale-150" aria-hidden="true" />
                  {service.shortTitle}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-2 lg:col-span-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Contacto directo</p>
          <address className="mt-6 grid gap-5 text-sm not-italic">
            <a href={`tel:+${contact.electronics.phone}`} className="group flex items-start gap-3 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Phone className="mt-0.5 shrink-0 text-primary" size={18} weight="fill" aria-hidden="true" />
              <span><strong className="block font-medium text-foreground">Electrónica</strong>{contact.electronics.display}</span>
            </a>
            <a href={`tel:+${contact.mechanics.phone}`} className="group flex items-start gap-3 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Phone className="mt-0.5 shrink-0 text-primary" size={18} weight="fill" aria-hidden="true" />
              <span><strong className="block font-medium text-foreground">Mecánica</strong>{contact.mechanics.display}</span>
            </a>
            <a href={`mailto:${contact.email}`} className="flex items-start gap-3 break-all text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Envelope className="mt-0.5 shrink-0 text-primary" size={18} weight="fill" aria-hidden="true" />
              <span>{contact.email}</span>
            </a>
            <a href={contact.maps} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <MapPin className="mt-0.5 shrink-0 text-primary" size={18} weight="fill" aria-hidden="true" />
              <span>{contact.address}</span>
            </a>
          </address>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            © {new Date().getFullYear()} HM Motorsport · Albatera, Alicante
          </p>
          <nav aria-label="Información y páginas legales" className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {hmNavigation.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {item.title}
              </Link>
            ))}
            {legalNavigation.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
