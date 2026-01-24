export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  id?: string;
  tempId?: string;
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
