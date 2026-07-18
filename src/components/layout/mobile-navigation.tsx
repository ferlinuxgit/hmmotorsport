"use client";

import { List, X } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import type { NavItem } from "@/lib/modules/contracts";
import { cn } from "@/lib/utils";

export function MobileNavigation({
  navigation,
  signedIn,
  isAdmin
}: {
  navigation: NavItem[];
  signedIn: boolean;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <Button
        variant="outline"
        size="sm"
        aria-expanded={open}
        aria-controls="mobile-navigation-panel"
        aria-label={open ? "Cerrar navegación" : "Abrir navegación"}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={18} weight="bold" aria-hidden="true" /> : <List size={18} weight="bold" aria-hidden="true" />}
      </Button>

      {open ? (
        <div id="mobile-navigation-panel" className="absolute inset-x-4 top-[calc(100%+0.5rem)] rounded-2xl border bg-card p-3 shadow-panel">
          <nav aria-label="Navegación móvil" className="grid gap-1">
            {navigation.map((item) => (
              <Link
                key={`${item.href}-${item.title}`}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-3 text-sm transition hover:bg-secondary",
                  pathname === item.href && "bg-secondary font-semibold"
                )}
              >
                <span className="block font-medium">{item.title}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{item.description}</span>
              </Link>
            ))}
            <div className="my-2 h-px bg-border" />
            {signedIn ? (
              <>
                <Link href="/dashboard" className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary">Dashboard</Link>
                <Link href="/account" className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary">Cuenta</Link>
                {isAdmin ? <Link href="/admin" className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary">Admin</Link> : null}
                <SignOutButton className="mt-2 w-full" />
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" asChild><Link href="/sign-in">Entrar</Link></Button>
                <Button asChild><Link href="/sign-up">Crear cuenta</Link></Button>
              </div>
            )}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
