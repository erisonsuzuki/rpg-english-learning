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

export async function groqChat(messages: ChatMessage[]): Promise<ProviderResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY");
  }

  const model = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
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
    throw new Error(`Groq error: ${response.status} ${text}`);
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
    throw new Error("Groq returned empty content");
  }

  return {
    content: content.trim(),
    model: data?.model || model,
    usage,
  };
}
