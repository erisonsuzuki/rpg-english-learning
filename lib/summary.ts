import { groqChat } from "@/lib/providers/groq";
import type { ChatMessage } from "@/lib/types";

const SUMMARY_THRESHOLD = 18;
const KEEP_TAIL = 8;
const SUMMARY_PREFIX = "Summary of conversation so far:";

function formatForSummary(messages: ChatMessage[]) {
  return messages
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n");
}

export async function maybeSummarize(
  messages: ChatMessage[]
): Promise<ChatMessage[]> {
  if (messages.length <= SUMMARY_THRESHOLD) return messages;

  const head = messages.slice(0, Math.max(0, messages.length - KEEP_TAIL));
  const tail = messages.slice(-KEEP_TAIL);
  const summaryPrompt = formatForSummary(head);

  try {
    const summary = await groqChat([
      {
        role: "system" as const,
        content:
          "Summarize the conversation for continuity in a story-driven English learning RPG. " +
          "Focus on plot facts, character details, user choices, corrections, and key vocabulary. " +
          "Keep it concise and in English.",
      },
      { role: "user" as const, content: summaryPrompt },
    ]);

    if (!summary) return messages;

    return [
      { role: "system" as const, content: `${SUMMARY_PREFIX}\n${summary}` },
      ...tail,
    ];
  } catch {
    return messages;
  }
}
