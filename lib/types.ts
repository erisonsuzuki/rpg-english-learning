export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
  provider?: string;
  model?: string;
};

export type CharacterProfile = {
  name?: string;
  class?: string;
  backstory?: string;
  stats?: string;
};

export type PromptContext = {
  character?: CharacterProfile;
  level?: string;
  uiLanguage?: string;
};
