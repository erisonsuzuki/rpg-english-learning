import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/providers/groq", () => ({
  groqChat: vi.fn(),
}));

import { groqChat } from "@/lib/providers/groq";
import { maybeSummarize } from "@/lib/summary";
import type { ChatMessage } from "@/lib/types";

const mockedGroqChat = vi.mocked(groqChat);

function buildMessages(count: number): ChatMessage[] {
  return Array.from({ length: count }, (_, index) => ({
    role: index % 2 === 0 ? "user" : "assistant",
    content: `Message ${index}`,
  }));
}

describe("maybeSummarize", () => {
  it("returns original messages below the threshold", async () => {
    const messages = buildMessages(10);
    const result = await maybeSummarize(messages);
    expect(result).toBe(messages);
  });

  it("inserts a summary and keeps the tail when above threshold", async () => {
    mockedGroqChat.mockResolvedValueOnce({
      content: "Short summary",
      model: "test-model",
    });
    const messages = buildMessages(20);
    const result = await maybeSummarize(messages);

    expect(mockedGroqChat).toHaveBeenCalledTimes(1);
    expect(result.length).toBe(9);
    expect(result[0].role).toBe("system");
    expect(result[0].content).toMatch(/^Summary of conversation so far:/);
  });

  it("returns original messages when summarization fails", async () => {
    mockedGroqChat.mockRejectedValueOnce(new Error("No summary"));
    const messages = buildMessages(20);
    const result = await maybeSummarize(messages);
    expect(result).toBe(messages);
  });
});
