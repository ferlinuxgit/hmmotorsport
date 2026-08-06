import { InstagramLogo, MapPin, Phone } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";

import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { getCurrentAccount } from "@/lib/auth/server";
import { contact, hmNavigation } from "@/lib/hm-content";

export async function SiteHeader() {
  const account = await getCurrentAccount();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-xl">
      <div className="hidden bg-primary text-primary-foreground lg:block">
        <div className="mx-auto flex h-9 max-w-[1440px] items-center justify-between px-10 font-mono text-[10px] uppercase tracking-[0.14em]">
          <div className="flex items-center gap-6">
            <a className="inline-flex items-center gap-2 transition hover:text-white" href={`tel:+${contact.electronics.phone}`}><Phone size={13} weight="fill" aria-hidden="true" /> Electrónica · {contact.electronics.display}</a>
            <a className="inline-flex items-center gap-2 transition hover:text-white" href={`tel:+${contact.mechanics.phone}`}><Phone size={13} weight="fill" aria-hidden="true" /> Mecánica · {contact.mechanics.display}</a>
          </div>
          <div className="flex items-center gap-6">
            <a className="inline-flex items-center gap-2 transition hover:text-white" href={contact.maps} target="_blank" rel="noreferrer"><MapPin size={13} weight="fill" aria-hidden="true" /> Albatera · Alicante</a>
            <a className="inline-flex items-center gap-2 transition hover:text-white" href={contact.instagram} target="_blank" rel="noreferrer"><InstagramLogo size={14} weight="fill" aria-hidden="true" /> Instagram</a>
          </div>
        </div>
      </div>

      <div className="relative mx-auto flex h-[76px] max-w-[1440px] items-center justify-between gap-8 px-4 sm:px-6 lg:h-[82px] lg:px-10">
        <Link href="/" className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Image src="/images/hm/logo-horizontal.png" alt="HM Motorsport" width={300} height={44} className="h-auto w-[218px] sm:w-[250px]" />
        </Link>

        <nav aria-label="Navegación principal" className="hidden items-center gap-8 lg:flex">
          {hmNavigation.map((item) => (
            <Link key={item.href} href={item.href} prefetch={false} className="group relative py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {item.title}
              <span className="absolute inset-x-0 -bottom-1 h-px origin-left scale-x-0 bg-primary transition-transform duration-200 group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {account ? <Link href="/dashboard" className="px-2 py-2 text-sm text-muted-foreground transition hover:text-foreground">Panel</Link> : null}
          <a href={`https://wa.me/${contact.electronics.phone}`} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:-translate-y-px hover:bg-primary/90 active:translate-y-0">
            Hablar con el taller
          </a>
        </div>

        <MobileNavigation navigation={hmNavigation} signedIn={Boolean(account)} />
      </div>
    </header>
  );
}
