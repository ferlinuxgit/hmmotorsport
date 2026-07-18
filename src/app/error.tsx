"use client";

import { WarningCircle } from "@phosphor-icons/react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main-content" className="mx-auto flex min-h-[70dvh] max-w-3xl items-center px-4 py-16 sm:px-6">
      <div className="w-full rounded-3xl border border-border bg-card p-8 text-center sm:p-12">
        <WarningCircle size={40} weight="duotone" className="mx-auto text-destructive" aria-hidden="true" />
        <h1 className="mt-6 text-3xl font-semibold tracking-[-0.035em]">No pudimos cargar esta vista.</h1>
        <p className="mx-auto mt-4 max-w-lg leading-7 text-muted-foreground">La operación no se completó. Puedes intentarlo de nuevo sin perder la navegación actual.</p>
        <Button className="mt-7" onClick={reset}>Reintentar</Button>
      </div>
    </main>
  );
}
