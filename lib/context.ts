import type { ChatMessage } from "@/lib/types";

const SUMMARY_PREFIX = "Summary of conversation so far:";

export function trimMessages(messages: ChatMessage[], limit = 12) {
  if (messages.length <= limit) return messages;

  const summaryIndex = messages.findIndex(
    (message) =>
      message.role === "system" && message.content.startsWith(SUMMARY_PREFIX)
  );
  const tail = messages.slice(-limit);

  if (summaryIndex === -1) return tail;

  const summary = messages[summaryIndex];
  const withoutSummary = tail.filter((message) => message !== summary);
  return [summary, ...withoutSummary];
}
