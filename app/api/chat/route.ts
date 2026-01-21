import { NextResponse } from "next/server";
import { buildSystemPrompt } from "@/lib/prompt";
import { groqChat } from "@/lib/providers/groq";
import { nemotronChat } from "@/lib/providers/nemotron";
import { runWithFallback } from "@/lib/providers/fallback";
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
    const preferredProvider = body.provider === "nemotron" ? "nemotron" : "groq";

    if (!messages?.length) {
      return NextResponse.json(
        { error: "Missing chat messages" },
        { status: 400 }
      );
    }

    const system = buildSystemPrompt({ character, level, uiLanguage });
    const summarized = await maybeSummarize(messages);
    const trimmed = trimMessages(summarized);
    const payload: ChatMessage[] = [
      { role: "system" as const, content: system },
      ...trimmed,
    ];

    const output = await runWithFallback((provider) => {
      const run = provider === "nemotron" ? nemotronChat : groqChat;
      return run(payload);
    }, preferredProvider);

    return NextResponse.json({ output });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
