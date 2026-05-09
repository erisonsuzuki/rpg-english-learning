import { NextResponse } from "next/server";
import { requireUser, isUnauthorizedError } from "@/lib/auth/require-user";
import {
  clearCharacter,
  fetchCharacter,
  upsertCharacter,
} from "@/lib/persistence/character-repo";
import type { CharacterProfile } from "@/lib/types";

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
    const character = await fetchCharacter(user.id);
    return NextResponse.json({ character });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireUser();
    const body = (await req.json()) as { character?: CharacterProfile };
    if (!body.character) {
      return NextResponse.json({ error: "Invalid character" }, { status: 400 });
    }
    await upsertCharacter(user.id, body.character);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE() {
  try {
    const user = await requireUser();
    await clearCharacter(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
