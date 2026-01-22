import type { ChatMessage } from "@/lib/types";
import type { ProviderResult, ProviderUsage } from "@/lib/providers/groq";

const NEMOTRON_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

export async function nemotronChat(
  messages: ChatMessage[]
): Promise<ProviderResult> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    throw new Error("Missing NVIDIA_API_KEY");
  }

  const model = process.env.NEMOTRON_MODEL || "nvidia/nemotron-3-nano-30b-a3b";
  const response = await fetch(NEMOTRON_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      top_p: 1,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Nemotron error: ${response.status} ${text}`);
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
    throw new Error("Nemotron returned empty content");
  }

  return {
    content: content.trim(),
    model: data?.model || model,
    usage,
  };
}
