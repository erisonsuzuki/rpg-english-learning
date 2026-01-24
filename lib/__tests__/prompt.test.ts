import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildSystemPrompt } from "@/lib/prompt";

describe("buildSystemPrompt", () => {
  it("returns the base prompt when no context is provided", () => {
    const promptPath = path.join(process.cwd(), "docs", "prompt.md");
    const basePrompt = fs
      .readFileSync(promptPath, "utf8")
      .trim()
      .replace(/^\uFEFF/, "")
      .replace(/\r\n/g, "\n");

    const result = buildSystemPrompt({})
      .replace(/^\uFEFF/, "")
      .replace(/\r\n/g, "\n");
    expect(result).toContain(basePrompt);
    expect(result).toContain("## Runtime Context");
  });

  it("appends runtime context when provided", () => {
    const result = buildSystemPrompt({
      level: "Beginner",
      uiLanguage: "Portuguese",
      character: {
        name: "Lyra",
        class: "Ranger",
        backstory: "Forest scout",
        stats: "AGI 7, WIS 6",
      },
    });

    expect(result).toContain("## Runtime Context");
    expect(result).toContain("English Level: Beginner");
    expect(result).toContain("App UI Language: Portuguese");
    expect(result).toContain("Character Profile");
    expect(result).toContain("Name: Lyra");
    expect(result).toContain("Class: Ranger");
  });
});
