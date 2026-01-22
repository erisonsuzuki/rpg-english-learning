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

export function trimMessagesByChars(messages: ChatMessage[], maxChars: number) {
  const totalChars = messages.reduce(
    (total, message) => total + message.content.length,
    0
  );
  if (totalChars <= maxChars) return messages;

  const summaryIndex = messages.findIndex(
    (message) =>
      message.role === "system" && message.content.startsWith(SUMMARY_PREFIX)
  );
  const summary = summaryIndex >= 0 ? messages[summaryIndex] : null;
  const tail = summary
    ? messages.filter((_, index) => index !== summaryIndex)
    : messages;

  const trimmed: ChatMessage[] = [];
  let remaining = maxChars;

  if (summary && summary.content.length <= remaining) {
    trimmed.push(summary);
    remaining -= summary.content.length;
  }

  for (let i = tail.length - 1; i >= 0; i -= 1) {
    const message = tail[i];
    if (message.content.length > remaining) continue;
    trimmed.unshift(message);
    remaining -= message.content.length;
    if (remaining <= 0) break;
  }

  return trimmed.length ? trimmed : messages.slice(-1);
}
