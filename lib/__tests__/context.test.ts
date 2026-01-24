import { describe, expect, it } from "vitest";
import { trimMessages, trimMessagesByChars } from "@/lib/context";
import type { ChatMessage } from "@/lib/types";

const SUMMARY_PREFIX = "Summary of conversation so far:";

describe("trimMessages", () => {
  it("preserves summary when trimming by count", () => {
    const summary: ChatMessage = {
      role: "system",
      content: `${SUMMARY_PREFIX}\nPlot points.`,
    };
    const messages: ChatMessage[] = [
      summary,
      ...Array.from({ length: 13 }, (_, index) => ({
        role: "user" as const,
        content: `Message ${index}`,
      })),
    ];

    const result = trimMessages(messages, 12);
    expect(result[0]).toBe(summary);
    expect(result.length).toBe(13);
  });
});

describe("trimMessagesByChars", () => {
  it("keeps summary and recent messages within char limit", () => {
    const summary: ChatMessage = {
      role: "system",
      content: `${SUMMARY_PREFIX}\nShort summary.`,
    };
    const messages: ChatMessage[] = [
      summary,
      { role: "user" as const, content: "First message" },
      { role: "assistant" as const, content: "Second message" },
      { role: "user" as const, content: "Tail message" },
    ];

    const result = trimMessagesByChars(messages, summary.content.length + 200);
    expect(result[0]).toBe(summary);
    expect(result[result.length - 1].content).toBe("Tail message");
  });
});
