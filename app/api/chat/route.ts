import { NextResponse } from "next/server";
import { buildSystemPrompt } from "@/lib/prompts";
import { guardChatInput, guardChatOutput } from "@/lib/guardrails";
import { getGroqModelPolicy, groqChat } from "@/lib/providers/groq";
import { trimMessages, trimMessagesByChars } from "@/lib/context";
import { maybeSummarize } from "@/lib/summary";
import { checkRateLimit } from "@/lib/rate-limit";
import { logLlmRequest, logLlmResponse } from "@/lib/llm-logging";
import { assertSameOrigin, getSessionUser } from "@/lib/auth";
import type { ChatMessage, PromptContext } from "@/lib/types";

type ChatRequest = PromptContext & {
  messages: ChatMessage[];
};

export async function POST(req: Request) {
  try {
    if (!assertSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = checkRateLimit(user.id, 20, 60_000);
    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        }
      );
    }

    const body = (await req.json()) as ChatRequest;
    const {
      messages,
      character,
      level,
      uiLanguage,
      correctionStyle,
      rpgTheme,
      learningGoal,
      narratorPersona,
    } = body;

    if (!messages?.length) {
      return NextResponse.json(
        { error: "Missing chat messages" },
        { status: 400 }
      );
    }

    const inputGuard = guardChatInput(messages);
    if (!inputGuard.ok) {
      console.warn("Chat input blocked", inputGuard);
      return NextResponse.json(
        { error: inputGuard.message },
        { status: 400 }
      );
    }

    const system = buildSystemPrompt({
      character,
      level,
      uiLanguage,
      correctionStyle,
      rpgTheme,
      learningGoal,
      narratorPersona,
    });
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
    logLlmRequest({
      feature: "chat",
      preferredProvider: "groq",
      messageCount: finalPayload.length,
      originalMessages: payload.length,
      contextChars,
      finalChars,
    });

    const providerPayload: ChatMessage[] = finalPayload.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    const result = await groqChat(providerPayload, getGroqModelPolicy("chat"));
    logLlmResponse({
      feature: "chat",
      provider: "groq",
      model: result.model,
      usage: result.usage,
    });

    const outputGuard = guardChatOutput(result.content);
    if (!outputGuard.ok) {
      console.warn("Chat output blocked", outputGuard);
      return NextResponse.json(
        { error: outputGuard.message },
        { status: 502 }
      );
    }

    return NextResponse.json({
      output: result.content,
      provider: "groq",
      model: result.model,
      usage: result.usage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
