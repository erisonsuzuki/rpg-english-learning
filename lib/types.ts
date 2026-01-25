export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  id?: string;
  tempId?: string;
  role: ChatRole;
  content: string;
  provider?: string;
  model?: string;
};

export type LlmSettings = {
  correctionStyle?: string;
  rpgTheme?: string;
  learningGoal?: string;
  narratorPersona?: string;
};

export type CharacterProfile = {
  name?: string;
  class?: string;
  backstory?: string;
  stats?: string;
  weakness?: string;
};

export type PromptContext = {
  character?: CharacterProfile;
  level?: string;
  uiLanguage?: string;
  correctionStyle?: string;
  rpgTheme?: string;
  learningGoal?: string;
  narratorPersona?: string;
};
