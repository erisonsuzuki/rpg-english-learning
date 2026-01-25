import { describe, expect, it } from "vitest";
import { buildCharacterPrompt } from "@/lib/prompts";

describe("buildCharacterPrompt", () => {
  it("uses English when no language preference is provided", () => {
    const prompt = buildCharacterPrompt({ answers: { Name: "Nova" } });
    expect(prompt).toContain("profile in English");
  });

  it("uses Portuguese when preference is Portuguese", () => {
    const prompt = buildCharacterPrompt({
      answers: { Name: "Nova" },
      languagePreference: "Portuguese",
    });
    expect(prompt).toContain("profile in Portuguese");
  });

  it("formats answers as bullet list", () => {
    const prompt = buildCharacterPrompt({
      answers: {
        Name: "Nova",
        Class: "Mage",
      },
    });
    expect(prompt).toContain("- Name: Nova");
    expect(prompt).toContain("- Class: Mage");
  });

  it("requests weakness in JSON keys", () => {
    const prompt = buildCharacterPrompt({ answers: { Name: "Nova" } });
    expect(prompt).toContain("name, class, backstory, stats, weakness");
  });

  it("falls back to no answers when empty", () => {
    const prompt = buildCharacterPrompt({ answers: {} });
    expect(prompt).toContain("- no answers provided");
  });
});
