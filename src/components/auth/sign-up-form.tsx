"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/auth-client";
import { resolveSafeRedirect } from "@/lib/auth/redirects";

function resolveErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "No se pudo crear la cuenta.";
}

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setError(null);

    try {
      const destination = resolveSafeRedirect(searchParams.get("next"));
      const { error: signUpError } = await authClient.signUp.email({
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        callbackURL: destination
      });

      if (signUpError) {
        throw new Error(signUpError.message || "No se pudo crear la cuenta.");
      }

      router.replace(destination);
      router.refresh();
    } catch (submitError) {
      setError(resolveErrorMessage(submitError));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className="border-border/80 bg-card">
      <CardHeader>
        <CardTitle className="text-2xl">Crear cuenta</CardTitle>
        <CardDescription>Configura tu identidad para acceder a las superficies privadas.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={async (formData) => {
            await handleSubmit(formData);
          }}
          className="space-y-4"
        >
          <label className="block space-y-2" htmlFor="sign-up-name">
            <span className="text-sm font-medium">Nombre</span>
            <Input
              id="sign-up-name"
              name="name"
              type="text"
              autoComplete="name"
              required
            />
          </label>
          <label className="block space-y-2" htmlFor="sign-up-email">
            <span className="text-sm font-medium">Email</span>
            <Input
              id="sign-up-email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>
          <label className="block space-y-2" htmlFor="sign-up-password">
            <span className="text-sm font-medium">Contraseña</span>
            <Input
              id="sign-up-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              aria-describedby="sign-up-password-help"
            />
            <span id="sign-up-password-help" className="block text-xs text-muted-foreground">Mínimo 8 caracteres. Evita reutilizar una contraseña existente.</span>
          </label>
          <div aria-live="polite" aria-atomic="true">
            {error ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button className="sm:min-w-32" type="submit" disabled={isPending}>
              {isPending ? "Creando..." : "Crear cuenta"}
            </Button>
            <Link href="/sign-in" className="rounded text-sm text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Ya tengo cuenta
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
