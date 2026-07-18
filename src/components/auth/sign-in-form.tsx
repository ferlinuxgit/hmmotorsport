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

  return "No se pudo iniciar sesión.";
}

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setError(null);

    try {
      const destination = resolveSafeRedirect(searchParams.get("next"));
      const { error: signInError } = await authClient.signIn.email({
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        callbackURL: destination
      });

      if (signInError) {
        throw new Error(signInError.message || "No se pudo iniciar sesión.");
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
        <CardTitle className="text-2xl">Entrar</CardTitle>
        <CardDescription>Usa las credenciales asociadas a tu cuenta.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={async (formData) => {
            await handleSubmit(formData);
          }}
          className="space-y-4"
        >
          <label className="block space-y-2" htmlFor="sign-in-email">
            <span className="text-sm font-medium">Email</span>
            <Input
              id="sign-in-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-describedby="sign-in-email-help"
            />
            <span id="sign-in-email-help" className="block text-xs text-muted-foreground">La dirección utilizada al crear tu cuenta.</span>
          </label>
          <label className="block space-y-2" htmlFor="sign-in-password">
            <span className="text-sm font-medium">Contraseña</span>
            <Input
              id="sign-in-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <div aria-live="polite" aria-atomic="true">
            {error ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button className="sm:min-w-28" type="submit" disabled={isPending}>
              {isPending ? "Entrando..." : "Entrar"}
            </Button>
            <Link href="/sign-up" className="rounded text-sm text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Crear cuenta
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
