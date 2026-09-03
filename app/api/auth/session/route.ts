import { NextResponse } from "next/server";
import { getSessionUser, noStoreHeaders } from "@/lib/auth";

export async function GET() {
  return NextResponse.json({ user: await getSessionUser() }, { headers: noStoreHeaders });
}
