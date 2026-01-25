import type { ChatMessage, CharacterProfile, LlmSettings } from "@/lib/types";

export type AuthUser = {
  id: string;
  email: string | null;
};

export type AppState = {
  character: CharacterProfile;
  llmSettings?: LlmSettings;
  level: string;
  uiLanguage: string;
  correctionStyle: string;
  rpgTheme: string;
  learningGoal: string;
  narratorPersona: string;
  theme: "light" | "dark";
  textSize: "small" | "medium" | "large";
  messages: ChatMessage[];
  hasMoreMessages: boolean;
  user: AuthUser | null;
};
