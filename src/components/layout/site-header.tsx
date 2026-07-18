import Link from "next/link";

import { HeaderAuth } from "@/components/auth/header-auth";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { getCurrentAccount } from "@/lib/auth/server";
import { siteConfig } from "@/lib/config/site";
import { getSiteNavigation } from "@/lib/modules/loader";

export async function SiteHeader() {
  const navigation = getSiteNavigation();
  const account = await getCurrentAccount();

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="relative mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
            UB
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Foundation</p>
            <p className="truncate text-sm font-semibold sm:text-base">{siteConfig.name}</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navigation.map((item) => (
            <Link key={`${item.href}-${item.title}`} href={item.href} className="rounded-md text-sm text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center lg:flex">
          <HeaderAuth account={account} />
        </div>
        <MobileNavigation navigation={navigation} signedIn={Boolean(account)} isAdmin={account?.role === "admin"} />
      </div>
    </header>
  );
}
