import { NextResponse } from "next/server";
import { buildSystemPrompt } from "@/lib/prompt";
import { groqChat } from "@/lib/providers/groq";
import { nemotronChat } from "@/lib/providers/nemotron";
import { trimMessages } from "@/lib/context";
import { maybeSummarize } from "@/lib/summary";
import type { ChatMessage, PromptContext } from "@/lib/types";

type ChatRequest = PromptContext & {
  messages: ChatMessage[];
  provider?: "groq" | "nemotron";
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatRequest;
    const { messages, character, level, uiLanguage } = body;
    const provider = body.provider === "nemotron" ? "nemotron" : "groq";

    if (!messages?.length) {
      return NextResponse.json(
        { error: "Missing chat messages" },
        { status: 400 }
      );
    }

    const system = buildSystemPrompt({ character, level, uiLanguage });
    const summarized = await maybeSummarize(messages);
    const trimmed = trimMessages(summarized);
    const payload = [{ role: "system", content: system }, ...trimmed];

    const run = provider === "nemotron" ? nemotronChat : groqChat;
    const output = await run(payload);

    return NextResponse.json({ output });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
