import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AdminNavigation } from "@/components/admin/admin-navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { requireAdminAccount } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminAccount().catch((error) => {
    if (error instanceof Error && error.message === "Forbidden") {
      redirect("/dashboard");
    }

    redirect("/sign-in");
  });

  return (
    <div className="min-h-[100dvh]">
      <SiteHeader />
      <AdminNavigation />
      {children}
    </div>
  );
}
