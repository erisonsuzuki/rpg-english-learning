import { NextResponse } from "next/server";
import { guardChatInput, guardChatOutput } from "@/lib/guardrails";
import { runWithFallback } from "@/lib/providers/fallback";
import { groqChat } from "@/lib/providers/groq";
import { nemotronChat } from "@/lib/providers/nemotron";
import { trimMessages, trimMessagesByChars } from "@/lib/context";
import { maybeSummarize } from "@/lib/summary";
import { checkRateLimit } from "@/lib/rate-limit";
import { buildReviewSystemPrompt } from "@/lib/prompts";
import { logLlmRequest, logLlmResponse } from "@/lib/llm-logging";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { fetchMessages } from "@/lib/supabase/messages";
import type { ChatMessage, PromptContext, ReviewResult } from "@/lib/types";

type ReviewRequest = PromptContext & {
  provider?: "groq" | "nemotron";
  messageLimit?: number;
  limits?: {
    vocabulary?: number;
    sentences?: number;
  };
};

const DEFAULT_VOCAB_LIMIT = 8;
const DEFAULT_SENTENCE_LIMIT = 6;
const MAX_VOCAB_LIMIT = 20;
const MAX_SENTENCE_LIMIT = 20;
const DEFAULT_MESSAGE_LIMIT = 10;
const MAX_MESSAGE_LIMIT = 50;
const MAX_CONTEXT_CHARS = 12000;

function clampLimit(value: number | undefined, fallback: number, max: number) {
  if (!value || Number.isNaN(value) || value <= 0) return fallback;
  return Math.min(Math.floor(value), max);
}


function parseReview(raw: string): ReviewResult {
  const trimmed = raw.trim();
  let parsed: ReviewResult;
  try {
    parsed = JSON.parse(trimmed) as ReviewResult;
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Review generation returned invalid JSON");
    }
    parsed = JSON.parse(match[0]) as ReviewResult;
  }

  const vocabulary = Array.isArray(parsed.vocabulary) ? parsed.vocabulary : [];
  const sentenceImprovements = Array.isArray(parsed.sentenceImprovements)
    ? parsed.sentenceImprovements
    : [];

  return {
    vocabulary: vocabulary.map((item) => ({
      term: typeof item?.term === "string" ? item.term.trim() : "",
      meaning: typeof item?.meaning === "string" ? item.meaning.trim() : "",
      example: typeof item?.example === "string" ? item.example.trim() : "",
    })),
    sentenceImprovements: sentenceImprovements.map((item) => ({
      original: typeof item?.original === "string" ? item.original.trim() : "",
      improved: typeof item?.improved === "string" ? item.improved.trim() : "",
      explanation: typeof item?.explanation === "string" ? item.explanation.trim() : "",
    })),
  };
}

function trimReview(
  review: ReviewResult,
  limits: { vocabulary: number; sentences: number }
): ReviewResult {
  return {
    vocabulary: review.vocabulary
      .filter((item) => item.term || item.meaning || item.example)
      .slice(0, limits.vocabulary),
    sentenceImprovements: review.sentenceImprovements
      .filter((item) => item.original || item.improved || item.explanation)
      .slice(0, limits.sentences),
  };
}


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

    const body = (await req.json()) as ReviewRequest;
    const {
      character,
      level,
      uiLanguage,
      correctionStyle,
      rpgTheme,
      learningGoal,
      narratorPersona,
    } = body;
    const preferredProvider = body.provider === "nemotron" ? "nemotron" : "groq";
    const limits = {
      vocabulary: clampLimit(
        body.limits?.vocabulary,
        DEFAULT_VOCAB_LIMIT,
        MAX_VOCAB_LIMIT
      ),
      sentences: clampLimit(
        body.limits?.sentences,
        DEFAULT_SENTENCE_LIMIT,
        MAX_SENTENCE_LIMIT
      ),
    };
    const messageLimit = clampLimit(
      body.messageLimit,
      DEFAULT_MESSAGE_LIMIT,
      MAX_MESSAGE_LIMIT
    );

    const messages = await fetchMessages(supabase, data.user.id, {
      limit: messageLimit,
    });
    if (!messages.length) {
      return NextResponse.json(
        { error: "Missing chat messages" },
        { status: 400 }
      );
    }


    const inputGuard = guardChatInput(messages);
    if (!inputGuard.ok) {
      console.warn("Review input blocked", inputGuard);
      return NextResponse.json(
        { error: inputGuard.message },
        { status: 400 }
      );
    }

    const system = buildReviewSystemPrompt(
      {
        character,
        level,
        uiLanguage,
        correctionStyle,
        rpgTheme,
        learningGoal,
        narratorPersona,
      },
      limits
    );
    const summarized = await maybeSummarize(messages);
    const trimmed = trimMessages(summarized);
    const payload: ChatMessage[] = [
      { role: "system" as const, content: system },
      ...trimmed,
    ];

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
      feature: "review",
      preferredProvider,
      messageCount: finalPayload.length,
      originalMessages: payload.length,
      contextChars,
      finalChars,
      limits,
      payloadChars: contextChars,
    });

    const providerPayload: ChatMessage[] = finalPayload.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    const { result, provider } = await runWithFallback((provider) => {
      const run = provider === "nemotron" ? nemotronChat : groqChat;
      return run(providerPayload);
    }, preferredProvider);

    logLlmResponse({
      feature: "review",
      provider,
      model: result.model,
      usage: result.usage,
    });

    const outputGuard = guardChatOutput(result.content);
    if (!outputGuard.ok) {
      console.warn("Review output blocked", outputGuard);
      return NextResponse.json(
        { error: outputGuard.message },
        { status: 502 }
      );
    }

    const review = trimReview(parseReview(result.content), limits);

    return NextResponse.json({
      review,
      provider,
      model: result.model,
      usage: result.usage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
