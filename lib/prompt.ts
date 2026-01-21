import fs from "node:fs";
import path from "node:path";
import type { PromptContext } from "@/lib/types";

const promptPath = path.join(process.cwd(), "docs", "prompt.md");
const basePrompt = fs.readFileSync(promptPath, "utf8");

function formatCharacterBlock(context: PromptContext) {
  const { character } = context;
  if (!character) return "";

  const lines = [
    character.name ? `Name: ${character.name}` : "",
    character.class ? `Class: ${character.class}` : "",
    character.backstory ? `Backstory: ${character.backstory}` : "",
    character.stats ? `Stats: ${character.stats}` : "",
  ].filter(Boolean);

  return lines.length ? `Character Profile\n${lines.join("\n")}` : "";
}

export function buildSystemPrompt(context: PromptContext) {
  const blocks = [
    "## Runtime Context",
    "Use this context to tailor the story, corrections, and difficulty.",
    "If English level or RPG theme are missing, ask the user for them.",
    context.level ? `English Level: ${context.level}` : "",
    context.uiLanguage ? `App UI Language: ${context.uiLanguage}` : "",
    formatCharacterBlock(context),
  ].filter(Boolean);

  if (!blocks.length) return basePrompt.trim();
  return `${basePrompt.trim()}\n\n---\n\n${blocks.join("\n\n")}`;
}
