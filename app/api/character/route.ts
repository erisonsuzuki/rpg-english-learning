import { NextResponse } from "next/server";
import { buildCharacterPrompt } from "@/lib/character-prompt";
import { runWithFallback } from "@/lib/providers/fallback";
import { groqChat } from "@/lib/providers/groq";
import { nemotronChat } from "@/lib/providers/nemotron";
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
    const body = (await req.json()) as CharacterRequest;
    const { answers, languagePreference } = body;
    const preferredProvider = body.provider === "nemotron" ? "nemotron" : "groq";

    if (!answers || Object.values(answers).every((value) => !value.trim())) {
      return NextResponse.json(
        { error: "Missing character answers" },
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

    const output = await runWithFallback((provider) => {
      const run = provider === "nemotron" ? nemotronChat : groqChat;
      return run(messages);
    }, preferredProvider);

    const draftCharacter = parseCharacterProfile(output);
    return NextResponse.json({ draftCharacter });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
