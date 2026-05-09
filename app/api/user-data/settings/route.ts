import { NextResponse } from "next/server";
import { requireUser, isUnauthorizedError } from "@/lib/auth/require-user";
import {
  fetchUserSettings,
  upsertUserSettings,
} from "@/lib/persistence/user-settings-repo";
import type { UserSettings } from "@/lib/types";

function errorResponse(error: unknown) {
  if (isUnauthorizedError(error)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const message = error instanceof Error ? error.message : "Unknown error";
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET() {
  try {
    const user = await requireUser();
    const settings = await fetchUserSettings(user.id);
    return NextResponse.json({ settings });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireUser();
    const body = (await req.json()) as { settings?: UserSettings };
    if (!body.settings) {
      return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
    }
    await upsertUserSettings(user.id, body.settings);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
