import { describe, expect, it } from "vitest";
import { runWithFallback } from "@/lib/providers/fallback";

describe("runWithFallback", () => {
  it("uses preferred provider first", async () => {
    const calls: string[] = [];
    const run = async (provider: "groq" | "nemotron") => {
      calls.push(provider);
      return `${provider}-ok`;
    };

    const result = await runWithFallback(run, "nemotron");
    expect(result.result).toBe("nemotron-ok");
    expect(result.provider).toBe("nemotron");
    expect(calls).toEqual(["nemotron"]);
  });

  it("falls back when the preferred provider fails", async () => {
    const calls: string[] = [];
    const run = async (provider: "groq" | "nemotron") => {
      calls.push(provider);
      if (provider === "groq") {
        throw new Error("Groq failed");
      }
      return "nemotron-ok";
    };

    const result = await runWithFallback(run, "groq");
    expect(result.result).toBe("nemotron-ok");
    expect(result.provider).toBe("nemotron");
    expect(calls).toEqual(["groq", "nemotron"]);
  });

  it("throws when all providers fail", async () => {
    const run = async () => {
      throw new Error("All failed");
    };

    await expect(runWithFallback(run, "groq")).rejects.toThrow("All failed");
  });
});
