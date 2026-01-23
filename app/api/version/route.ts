import { NextResponse } from "next/server";
import appVersion from "@/app-version.json";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(appVersion, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
