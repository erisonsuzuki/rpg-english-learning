import type { ChatMessage } from "@/lib/types";

export type ProviderUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export type ProviderResult = {
  content: string;
  model: string;
  usage?: ProviderUsage;
};

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export type GroqFeature = "chat" | "character" | "review" | "summary";

type GroqChatOptions = {
  model?: string;
  fallbackModels?: string[];
};

class GroqRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GroqRequestError";
  }
}

function getModelForFeature(feature: GroqFeature): string {
  const sharedPrimary = process.env.GROQ_MODEL;

  if (feature === "chat") {
    return process.env.GROQ_MODEL_CHAT || sharedPrimary || "openai/gpt-oss-20b";
  }
  if (feature === "character") {
    return process.env.GROQ_MODEL_CHARACTER || sharedPrimary || "openai/gpt-oss-120b";
  }
  if (feature === "review") {
    return process.env.GROQ_MODEL_REVIEW || sharedPrimary || "openai/gpt-oss-120b";
  }
  return process.env.GROQ_MODEL_SUMMARY || sharedPrimary || "openai/gpt-oss-120b";
}

export function getGroqModelPolicy(feature: GroqFeature): {
  model: string;
  fallbackModels: string[];
} {
  const fallback = process.env.GROQ_MODEL_FALLBACK || "llama-3.3-70b-versatile";
  return {
    model: getModelForFeature(feature),
    fallbackModels: [fallback],
  };
}

async function requestGroqModel(
  apiKey: string,
  messages: ChatMessage[],
  model: string
): Promise<ProviderResult> {
  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new GroqRequestError(`Groq error: ${response.status} ${text}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  const usage: ProviderUsage | undefined = data?.usage
    ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      }
    : undefined;

  if (!content) {
    throw new GroqRequestError("Groq returned empty content");
  }

  return {
    content: content.trim(),
    model: data?.model || model,
    usage,
  };
}

export async function groqChat(
  messages: ChatMessage[],
  options?: GroqChatOptions
): Promise<ProviderResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY");
  }

  const model = options?.model || process.env.GROQ_MODEL || "openai/gpt-oss-20b";
  const fallbackModels = options?.fallbackModels?.length
    ? options.fallbackModels
    : [process.env.GROQ_MODEL_FALLBACK || "llama-3.3-70b-versatile"];
  const modelCandidates = [model, ...fallbackModels.filter((item) => item !== model)];

  let lastError: unknown;
  for (const modelCandidate of modelCandidates) {
    try {
      return await requestGroqModel(apiKey, messages, modelCandidate);
    } catch (error) {
      if (!(error instanceof GroqRequestError)) {
        throw error;
      }
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Groq request failed");
}
