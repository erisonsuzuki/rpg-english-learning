import { NextResponse } from "next/server";
import { requireUser, isUnauthorizedError } from "@/lib/auth/require-user";
import { fetchCharacter } from "@/lib/persistence/character-repo";
import { fetchMessages } from "@/lib/persistence/messages-repo";
import { fetchUserSettings } from "@/lib/persistence/user-settings-repo";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function parseLimit(value: string | null) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const limit = parseLimit(url.searchParams.get("limit"));
    const [character, messages, settings] = await Promise.all([
      fetchCharacter(user.id),
      fetchMessages(user.id, { limit: limit + 1 }),
      fetchUserSettings(user.id),
    ]);
    return NextResponse.json({
      character,
      messages: messages.slice(0, limit),
      settings,
      hasMoreMessages: messages.length > limit,
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
