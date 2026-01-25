import { NextResponse } from "next/server";
import { buildCharacterPrompt } from "@/lib/prompts";
import {
  guardCharacterInput,
  guardCharacterOutput,
  validateCharacterProfile,
} from "@/lib/guardrails";
import { runWithFallback } from "@/lib/providers/fallback";
import { groqChat } from "@/lib/providers/groq";
import { nemotronChat } from "@/lib/providers/nemotron";
import { checkRateLimit } from "@/lib/rate-limit";
import { logLlmRequest, logLlmResponse } from "@/lib/llm-logging";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import type { ChatMessage, CharacterProfile } from "@/lib/types";

type CharacterRequest = {
  answers: Record<string, string>;
  languagePreference?: string;
  provider?: "groq" | "nemotron";
};

function parseCharacterProfile(raw: string): CharacterProfile {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed) as CharacterProfile;
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Character generation returned invalid JSON");
    }
    return JSON.parse(match[0]) as CharacterProfile;
  }
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

    const rateLimit = checkRateLimit(data.user.id, 10, 60_000);
    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        }
      );
    }

    const body = (await req.json()) as CharacterRequest;
    const { answers, languagePreference } = body;
    const preferredProvider = body.provider === "nemotron" ? "nemotron" : "groq";

    if (!answers || Object.values(answers).every((value) => !value.trim())) {
      return NextResponse.json(
        { error: "Missing character answers" },
        { status: 400 }
      );
    }

    const inputGuard = guardCharacterInput(answers);
    if (!inputGuard.ok) {
      console.warn("Character input blocked", inputGuard);
      return NextResponse.json(
        { error: inputGuard.message },
        { status: 400 }
      );
    }

    const prompt = buildCharacterPrompt({ answers, languagePreference });
    const messages: ChatMessage[] = [
      {
        role: "system" as const,
        content:
          "You are an RPG character creation assistant. Respond only with JSON.",
      },
      { role: "user" as const, content: prompt },
    ];

    const answerCount = Object.values(answers).filter((value) => value.trim())
      .length;
    const totalAnswerChars = Object.values(answers).reduce(
      (total, value) => total + value.length,
      0
    );
    const payloadChars = messages.reduce(
      (total, message) => total + message.content.length,
      0
    );
    logLlmRequest({
      feature: "character",
      preferredProvider,
      messageCount: messages.length,
      answerCount,
      totalAnswerChars,
      payloadChars,
    });

    const { result, provider } = await runWithFallback((provider) => {
      const run = provider === "nemotron" ? nemotronChat : groqChat;
      return run(messages);
    }, preferredProvider);

    logLlmResponse({
      feature: "character",
      provider,
      model: result.model,
      usage: result.usage,
    });

    const outputGuard = guardCharacterOutput(result.content);
    if (!outputGuard.ok) {
      console.warn("Character output blocked", outputGuard);
      return NextResponse.json(
        { error: outputGuard.message },
        { status: 502 }
      );
    }

    const draftCharacter = parseCharacterProfile(result.content);
    const profileGuard = validateCharacterProfile(draftCharacter);
    if (!profileGuard.ok) {
      console.warn("Character profile invalid", profileGuard);
      return NextResponse.json(
        { error: profileGuard.message },
        { status: 502 }
      );
    }
    return NextResponse.json({ draftCharacter });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
