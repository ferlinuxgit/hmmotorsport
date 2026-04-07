import { NextResponse } from "next/server";

import { getCurrentAccount, listRecentUsers } from "@/lib/auth/server";
import { isAdminRole } from "@/lib/auth/constants";

export async function GET() {
  const account = await getCurrentAccount();

  if (!account) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdminRole(account.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await listRecentUsers(50);
  return NextResponse.json({ users });
}

