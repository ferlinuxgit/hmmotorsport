"use client";

import { List, X } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { contact } from "@/lib/hm-content";
import { cn } from "@/lib/utils";

export function MobileNavigation({
  navigation,
  signedIn
}: {
  navigation: readonly { title: string; href: string }[];
  signedIn: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="flex size-11 items-center justify-center border border-border bg-card text-foreground transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-expanded={open}
        aria-controls="mobile-navigation-panel"
        aria-label={open ? "Cerrar navegación" : "Abrir navegación"}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={22} weight="bold" aria-hidden="true" /> : <List size={22} weight="bold" aria-hidden="true" />}
      </button>

      {open ? (
        <div id="mobile-navigation-panel" className="absolute inset-x-0 top-full border-y border-border bg-background p-4 shadow-2xl">
          <nav aria-label="Navegación móvil" className="mx-auto grid max-w-[1440px]">
            {navigation.map((item, index) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn("flex items-center justify-between border-b border-border px-2 py-4 text-lg font-semibold uppercase tracking-[-0.01em]", active && "text-accent")}
                >
                  {item.title}<span className="font-mono text-[10px] text-muted-foreground">0{index + 1}</span>
                </Link>
              );
            })}
            {signedIn ? <Link href="/dashboard" onClick={() => setOpen(false)} className="border-b border-border px-2 py-4 text-sm font-semibold">Panel privado</Link> : null}
            <a href={`https://wa.me/${contact.electronics.phone}`} target="_blank" rel="noreferrer" className="mt-4 inline-flex h-12 items-center justify-center bg-primary px-5 text-sm font-semibold text-primary-foreground">Hablar con el taller</a>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
