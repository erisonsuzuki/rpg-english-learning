import { NextResponse } from "next/server";
import { requireUser, isUnauthorizedError } from "@/lib/auth/require-user";
import { replaceMessages } from "@/lib/persistence/messages-repo";
import type { ChatMessage } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = (await req.json()) as { messages?: ChatMessage[] };
    if (!Array.isArray(body.messages)) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }
    const ids = await replaceMessages(user.id, body.messages);
    return NextResponse.json({ ids });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
