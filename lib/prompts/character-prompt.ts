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
    "Return only raw JSON with keys: name, class, backstory, stats, weakness.",
    "Do not wrap the JSON in markdown or code fences.",
    "Do not include any extra text, titles, or explanations.",
    "If you add anything besides the JSON object, the response is invalid.",
    "Keep stats as a short comma-separated string.",
    "Answers:",
    formattedAnswers || "- no answers provided",
  ].join("\n");
}
