import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SiteHeader } from "@/components/layout/site-header";
import { getCurrentAccount } from "@/lib/auth/server";

export default async function DashboardPage() {
  const account = await getCurrentAccount();

  if (!account) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <DashboardShell account={account} />
    </div>
  );
}

