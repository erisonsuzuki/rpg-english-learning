import { NextResponse } from "next/server";
import { buildSystemPrompt } from "@/lib/prompt";
import { groqChat } from "@/lib/providers/groq";
import { nemotronChat } from "@/lib/providers/nemotron";
import { runWithFallback } from "@/lib/providers/fallback";
import { trimMessages, trimMessagesByChars } from "@/lib/context";
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

    const MAX_CONTEXT_CHARS = 12000;
    const [systemMessage, ...rest] = payload;
    const capped = trimMessagesByChars(
      rest,
      Math.max(1000, MAX_CONTEXT_CHARS - systemMessage.content.length)
    );
    const finalPayload = [systemMessage, ...capped];

    const contextChars = payload.reduce(
      (total, message) => total + message.content.length,
      0
    );
    const finalChars = finalPayload.reduce(
      (total, message) => total + message.content.length,
      0
    );
    console.info("LLM request", {
      preferredProvider,
      messageCount: finalPayload.length,
      originalMessages: payload.length,
      contextChars,
      finalChars,
    });

    const providerPayload: ChatMessage[] = finalPayload.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    const { result, provider } = await runWithFallback((provider) => {
      const run = provider === "nemotron" ? nemotronChat : groqChat;
      return run(providerPayload);
    }, preferredProvider);

    console.info("LLM response", {
      provider,
      model: result.model,
      usage: result.usage,
    });

    return NextResponse.json({
      output: result.content,
      provider,
      model: result.model,
      usage: result.usage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
