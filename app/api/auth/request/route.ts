import { NextResponse } from "next/server";
import { assertSameOrigin, createSecret, hashSecret, noStoreHeaders } from "@/lib/auth";
import { sendMagicLink } from "@/lib/email";
import { createSupabaseServerClient } from "@/utils/supabase/server";

function requestIpKey(request: Request) {
  // Vercel sets this header after replacing client-supplied forwarding headers.
  return process.env.VERCEL === "1" ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || "deployment" : "deployment";
}

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: noStoreHeaders });
  }
  try {
    const { email } = await request.json() as { email?: unknown };
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : undefined;
    if (normalizedEmail && normalizedEmail.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      const token = createSecret();
      const nonce = createSecret();
      const expiresAt = new Date(Date.now() + Number(process.env.MAGIC_LINK_EXPIRE_MINUTES ?? 15) * 60_000).toISOString();
      const { data, error } = await createSupabaseServerClient().rpc("app_create_magic_token", {
        p_email: normalizedEmail,
        p_token_hash: hashSecret(token),
        p_nonce_hash: hashSecret(nonce),
        p_expires_at: expiresAt,
        p_cooldown_seconds: Math.max(1, Number(process.env.MAGIC_LINK_COOLDOWN_SECONDS ?? 60)),
        p_ip_key: requestIpKey(request),
        p_ip_limit: Math.max(1, Number(process.env.MAGIC_LINK_IP_RATE_LIMIT ?? 20)),
        p_ip_window_seconds: Math.max(1, Number(process.env.MAGIC_LINK_IP_RATE_WINDOW_SECONDS ?? 3600)),
      });
      if (!error && data?.[0]?.accepted) {
        const origin = new URL(request.url).origin;
        const link = `${origin}/auth/callback#token=${encodeURIComponent(token)}&nonce=${encodeURIComponent(nonce)}`;
        await sendMagicLink(normalizedEmail, link);
      }
    }
  } catch (error) {
    console.warn("Magic link request failed", error);
  }
  return NextResponse.json({ accepted: true }, { headers: noStoreHeaders });
}
