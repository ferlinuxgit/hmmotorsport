import Link from "next/link";

import { HeaderAuth } from "@/components/auth/header-auth";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/config/site";
import { getSiteNavigation } from "@/lib/modules/loader";

export function SiteHeader() {
  const navigation = getSiteNavigation();

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            UB
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">Base</p>
            <p className="text-base font-semibold">{siteConfig.name}</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navigation.map((item) => (
            <Link key={`${item.href}-${item.title}`} href={item.href} className="text-sm text-muted-foreground transition hover:text-foreground">
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button asChild>
            <Link href="/#stack">Explorar stack</Link>
          </Button>
          <HeaderAuth />
        </div>
      </div>
    </header>
  );
}
