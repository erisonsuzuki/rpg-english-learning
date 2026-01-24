import type { ChatMessage, CharacterProfile } from "@/lib/types";

export type AuthUser = {
  id: string;
  email: string | null;
};

export type AppState = {
  character: CharacterProfile;
  level: string;
  uiLanguage: string;
  theme: "light" | "dark";
  textSize: "small" | "medium" | "large";
  hasOnboarded: boolean;
  messages: ChatMessage[];
  hasMoreMessages: boolean;
  user: AuthUser | null;
};
