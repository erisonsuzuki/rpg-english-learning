import { afterEach, describe, expect, it, vi } from "vitest";
import { groqChat } from "@/lib/providers/groq";

function makeResponse(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("groqChat model fallback", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("uses fallback model when primary model fails", async () => {
    vi.stubEnv("GROQ_API_KEY", "test-key");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(makeResponse(500, { error: "primary failed" }))
      .mockResolvedValueOnce(
        makeResponse(200, {
          choices: [{ message: { content: "fallback output" } }],
          model: "llama-3.3-70b-versatile",
        })
      );

    const result = await groqChat(
      [{ role: "user", content: "hello" }],
      {
        model: "openai/gpt-oss-20b",
        fallbackModels: ["llama-3.3-70b-versatile"],
      }
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.content).toBe("fallback output");
    expect(result.model).toBe("llama-3.3-70b-versatile");
  });

  it("throws when all models fail", async () => {
    vi.stubEnv("GROQ_API_KEY", "test-key");
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(makeResponse(500, { error: "primary failed" }))
      .mockResolvedValueOnce(makeResponse(500, { error: "fallback failed" }));

    await expect(
      groqChat(
        [{ role: "user", content: "hello" }],
        {
          model: "openai/gpt-oss-20b",
          fallbackModels: ["llama-3.3-70b-versatile"],
        }
      )
    ).rejects.toThrow("Groq error: 500");
  });
});
