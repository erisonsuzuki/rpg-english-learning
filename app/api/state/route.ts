import { NextResponse } from "next/server";
import { assertSameOrigin, getSessionUser, noStoreHeaders } from "@/lib/auth";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { validateStateRequest } from "@/lib/state-validation";

const stateRateLimit = Math.max(1, Number(process.env.STATE_RATE_LIMIT ?? 120));
const stateRateWindowSeconds = Math.max(1, Number(process.env.STATE_RATE_WINDOW_SECONDS ?? 60));

async function allowStateRequest(userId: string) {
  const { data, error } = await createSupabaseServerClient().rpc("app_consume_state_rate_limit", { p_user_id: userId, p_limit: stateRateLimit, p_window_seconds: stateRateWindowSeconds });
  return !error && data === true;
}

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStoreHeaders });
  if (!await allowStateRequest(user.id)) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: noStoreHeaders });
  const offset = Number(new URL(request.url).searchParams.get("offset") ?? "0");
  const payload = validateStateRequest("load", { offset });
  if (!payload) return NextResponse.json({ error: "Invalid offset" }, { status: 400, headers: noStoreHeaders });
  const { data, error } = await createSupabaseServerClient().rpc("app_state", { p_user_id: user.id, p_action: "load", p_payload: payload });
  if (error) return NextResponse.json({ error: "Failed to load state" }, { status: 500, headers: noStoreHeaders });
  return NextResponse.json(data, { headers: noStoreHeaders });
}

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: noStoreHeaders });
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStoreHeaders });
  let body: { action?: unknown; payload?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400, headers: noStoreHeaders }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid request" }, { status: 400, headers: noStoreHeaders });
  const payload = validateStateRequest(body.action, body.payload ?? {});
  if (!payload || typeof body.action !== "string" || body.action === "load") return NextResponse.json({ error: "Invalid action or payload" }, { status: 400, headers: noStoreHeaders });
  if (!await allowStateRequest(user.id)) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: noStoreHeaders });
  const { data, error } = await createSupabaseServerClient().rpc("app_state", { p_user_id: user.id, p_action: body.action, p_payload: payload });
  if (error) return NextResponse.json({ error: "Failed to save state" }, { status: 500, headers: noStoreHeaders });
  return NextResponse.json(data, { headers: noStoreHeaders });
}
