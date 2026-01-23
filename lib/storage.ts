import type { ChatMessage, CharacterProfile } from "@/lib/types";

export type AppState = {
  character: CharacterProfile;
  level: string;
  uiLanguage: string;
  theme: "light" | "dark";
  textSize: "small" | "medium" | "large";
  hasOnboarded: boolean;
  messages: ChatMessage[];
};

const MAX_STORED_MESSAGES = 120;

const KEY = "rpg-english-state-v1";

export function loadState(): AppState | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as AppState) : null;
}

export function saveState(state: AppState) {
  if (typeof window === "undefined") return;
  const normalized: AppState = {
    ...state,
    messages: state.messages.slice(-MAX_STORED_MESSAGES),
  };
  window.localStorage.setItem(KEY, JSON.stringify(normalized));
}

export function clearState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

export function getStateSize(state: AppState) {
  return JSON.stringify(state).length;
}
