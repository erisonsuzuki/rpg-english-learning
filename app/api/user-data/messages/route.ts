import { NextResponse } from "next/server";
import { requireUser, isUnauthorizedError } from "@/lib/auth/require-user";
import {
  clearMessages,
  fetchMessages,
  insertMessage,
} from "@/lib/persistence/messages-repo";
import type { ChatMessage } from "@/lib/types";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function parsePositiveInt(value: string | null, fallback: number, max?: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed) || parsed < 0) return fallback;
  return max ? Math.min(parsed, max) : parsed;
}

function errorResponse(error: unknown) {
  if (isUnauthorizedError(error)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const message = error instanceof Error ? error.message : "Unknown error";
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const limit = parsePositiveInt(
      url.searchParams.get("limit"),
      DEFAULT_LIMIT,
      MAX_LIMIT
    );
    const offset = parsePositiveInt(url.searchParams.get("offset"), 0);
    const messages = await fetchMessages(user.id, { limit, offset });
    return NextResponse.json({ messages });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = (await req.json()) as { message?: ChatMessage };
    if (!body.message?.role || !body.message.content) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }
    const id = await insertMessage(user.id, body.message);
    return NextResponse.json({ id });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE() {
  try {
    const user = await requireUser();
    await clearMessages(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
