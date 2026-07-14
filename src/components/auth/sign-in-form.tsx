"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="border-border/70 shadow-panel">
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>Acceso con email y contraseña gestionado por Better Auth.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={async (formData) => {
            await handleSubmit(formData);
          }}
          className="space-y-4"
        >
          <label className="block space-y-2">
            <span className="text-sm font-medium">Email</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              className="h-11 w-full rounded-2xl border bg-background px-4 text-sm outline-none transition focus:border-primary"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Contraseña</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="h-11 w-full rounded-2xl border bg-background px-4 text-sm outline-none transition focus:border-primary"
            />
          </label>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <div className="flex items-center justify-between gap-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Entrando..." : "Entrar"}
            </Button>
            <Link href="/sign-up" className="text-sm text-muted-foreground transition hover:text-foreground">
              Crear cuenta
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
