import { NextResponse } from "next/server";
import { buildSystemPrompt } from "@/lib/prompt";
import { guardChatInput, guardChatOutput } from "@/lib/guardrails";
import { groqChat } from "@/lib/providers/groq";
import { nemotronChat } from "@/lib/providers/nemotron";
import { runWithFallback } from "@/lib/providers/fallback";
import { trimMessages, trimMessagesByChars } from "@/lib/context";
import { maybeSummarize } from "@/lib/summary";
import { checkRateLimit } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import type { ChatMessage, PromptContext } from "@/lib/types";

type ChatRequest = PromptContext & {
  messages: ChatMessage[];
  provider?: "groq" | "nemotron";
};

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.warn("Failed to read Supabase user", error);
    }
    if (!data.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = checkRateLimit(data.user.id, 20, 60_000);
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
    const preferredProvider = body.provider === "nemotron" ? "nemotron" : "groq";

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
      provider,
      model: result.model,
      usage: result.usage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
