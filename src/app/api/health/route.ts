import { NextResponse } from "next/server";

import { getInstalledModules } from "@/lib/modules/loader";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    modules: getInstalledModules().map((module) => module.key),
    timestamp: new Date().toISOString()
  });
}

