import { NextResponse } from "next/server";
import { assertSameOrigin, createSecret, hashSecret, noStoreHeaders, SESSION_COOKIE } from "@/lib/auth";
import { createSupabaseServerClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: noStoreHeaders });
  try {
    const { token, nonce } = await request.json() as { token?: string; nonce?: string };
    if (!token || !nonce) throw new Error("Missing credentials");
    const secret = createSecret();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString();
    const { data, error } = await createSupabaseServerClient().rpc("app_consume_magic_token", {
      p_token_hash: hashSecret(token), p_nonce_hash: hashSecret(nonce), p_session_hash: hashSecret(secret), p_expires_at: expiresAt,
    });
    if (error || !data?.[0]?.user_id) throw error ?? new Error("Invalid magic link");
    const response = NextResponse.json({ authenticated: true }, { headers: noStoreHeaders });
    response.cookies.set(SESSION_COOKIE, secret, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: new Date(expiresAt) });
    return response;
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401, headers: noStoreHeaders });
  }
}
