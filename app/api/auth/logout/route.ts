import { NextResponse } from "next/server";
import { assertSameOrigin, getSessionUser, hashSecret, noStoreHeaders, SESSION_COOKIE } from "@/lib/auth";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: noStoreHeaders });
  const secret = (await cookies()).get(SESSION_COOKIE)?.value;
  if (secret) await createSupabaseServerClient().rpc("app_revoke_session", { p_secret_hash: hashSecret(secret) });
  const response = NextResponse.json({ ok: true, user: await getSessionUser() }, { headers: noStoreHeaders });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
