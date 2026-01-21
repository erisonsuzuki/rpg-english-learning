type CharacterPromptParams = {
  answers: Record<string, string>;
  languagePreference?: string;
};

export function buildCharacterPrompt({
  answers,
  languagePreference,
}: CharacterPromptParams) {
  const language = languagePreference === "Portuguese" ? "Portuguese" : "English";
  const formattedAnswers = Object.entries(answers)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join("\n");

  return [
    `Create a concise RPG character profile in ${language}.`,
    "Return strict JSON with keys: name, class, backstory, stats.",
    "Keep stats as a short comma-separated string.",
    "Answers:",
    formattedAnswers || "- no answers provided",
  ].join("\n");
}
