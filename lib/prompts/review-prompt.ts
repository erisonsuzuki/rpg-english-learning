import type { PromptContext } from "@/lib/types";

export function buildReviewSystemPrompt(
  context: PromptContext,
  limits: { vocabulary: number; sentences: number }
) {
  const contextLines = [
    context.level ? `English Level: ${context.level}` : "",
    context.uiLanguage ? `App UI Language: ${context.uiLanguage}` : "",
    context.correctionStyle ? `Correction Style: ${context.correctionStyle}` : "",
    context.rpgTheme ? `RPG Theme: ${context.rpgTheme}` : "",
    context.learningGoal ? `Learning Goal: ${context.learningGoal}` : "",
    context.narratorPersona ? `Narrator Persona: ${context.narratorPersona}` : "",
  ].filter(Boolean);

  const contextBlock = contextLines.length
    ? `\n\nContext\n${contextLines.join("\n")}`
    : "";

  return (
    "You are a Data Extraction Specialist for an English learning app. " +
    "Analyze the conversation between the User and the Assistant (RPG Tutor) and extract structured learning data. " +
    "Use ONLY the provided messages; do not invent items. " +
    "Vocabulary: include terms the user sent as standalone words/expressions to ask for meaning. " +
    "Also include terms explicitly taught by the assistant in correction/teaching sections (e.g., Term/Expression, Mentor notes). " +
    "Extract meaning and example directly from the assistant explanation when available. " +
    "Sentence improvements: find user messages with errors and pair each with the assistant's correction (e.g., Corrected Sentence/Correction). " +
    "Use the user's original raw message as 'original' and the assistant's corrected sentence as 'improved'. " +
    "Ignore acknowledgments, story choices, or option numbers. " +
    `Return ONLY raw JSON with this shape: {"vocabulary": [{"term":"","meaning":"","example":""}], "sentenceImprovements": [{"original":"","improved":"","explanation":""}]}. ` +
    `Limit to at most ${limits.vocabulary} vocabulary items and ${limits.sentences} sentence improvements. ` +
    "Keep term, example, original, and improved in English. " +
    "Use the app UI language for meaning and explanation when provided; otherwise use English. " +
    "Do not include Markdown or extra keys." +
    contextBlock
  );
}
