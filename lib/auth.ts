import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/utils/supabase/server";

export const SESSION_COOKIE = "rpg_session";

export function hashSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

export function createSecret() {
  return randomBytes(32).toString("base64url");
}

export function isSameOrigin(origin: string | null, appOrigin: string) {
  return origin === appOrigin;
}

export function assertSameOrigin(request: Request) {
  return isSameOrigin(request.headers.get("origin"), new URL(request.url).origin);
}

export async function getSessionUser() {
  const secret = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!secret) return null;
  const { data, error } = await createSupabaseServerClient().rpc("app_session_user", {
    p_secret_hash: hashSecret(secret),
  });
  if (error || !data?.[0]) return null;
  return data[0] as { id: string; email: string };
}

export const noStoreHeaders = { "Cache-Control": "no-store, max-age=0" };
