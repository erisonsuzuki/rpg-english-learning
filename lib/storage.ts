import type { ChatMessage, CharacterProfile } from "@/lib/types";

export type AppState = {
  character: CharacterProfile;
  level: string;
  uiLanguage: string;
  messages: ChatMessage[];
};

const KEY = "rpg-english-state-v1";

export function loadState(): AppState | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as AppState) : null;
}

export function saveState(state: AppState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
}

export function clearState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
