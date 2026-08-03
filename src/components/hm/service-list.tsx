import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";

import { getServiceHref, services } from "@/lib/hm-content";

export function ServiceList({ compact = false }: { compact?: boolean }) {
  return (
    <div className="border-t border-border">
      {services.map((service, index) => (
        <article key={service.slug} className="group border-b border-border">
          <Link
            href={getServiceHref(service)}
            className="grid gap-5 py-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:grid-cols-[64px_240px_1fr_auto] md:items-center md:gap-7 lg:grid-cols-[72px_300px_1fr_auto] lg:py-8"
          >
            <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
            <div className={`relative overflow-hidden bg-secondary ${compact ? "aspect-[16/8] md:aspect-[16/9]" : "aspect-[16/9]"}`}>
              <Image
                src={service.image}
                alt={service.imageAlt}
                fill
                sizes="(max-width: 768px) 100vw, 300px"
                className="object-cover saturate-[0.85] transition duration-500 group-hover:scale-[1.035] group-hover:saturate-100"
              />
              <div className="absolute inset-0 bg-black/15 transition group-hover:bg-transparent" />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">{service.code}</p>
              <h3 className="mt-2 text-2xl font-semibold uppercase leading-none tracking-[-0.02em] sm:text-3xl">{service.title}</h3>
              <p className="mt-3 max-w-[62ch] text-sm leading-6 text-muted-foreground">{service.description}</p>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
                {service.tags.map((tag) => (
                  <span key={tag} className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/60">{tag}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border pt-4 text-sm font-semibold md:block md:border-0 md:pt-0">
              <span>{service.detailAvailable ? "Ver servicio" : "Consultar"}</span>
              <ArrowUpRight className="mt-2 text-primary transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1 md:ml-auto" size={23} weight="bold" aria-hidden="true" />
            </div>
          </Link>
        </article>
      ))}
    </div>
  );
}
