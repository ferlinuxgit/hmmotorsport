import type { Metadata } from "next";
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
    <div className="min-h-[100dvh]">
      <SiteHeader />
      <DashboardShell account={account} />
    </div>
  );
}
export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false }
};
