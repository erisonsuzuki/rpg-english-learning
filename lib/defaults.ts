import type { AppState } from "@/lib/app-state";

export const defaultState: AppState = {
  character: {
    name: "",
    class: "",
    backstory: "",
    stats: "",
  },
  level: "Intermediate",
  uiLanguage: "English",
  theme: "dark",
  textSize: "medium",
  hasOnboarded: false,
  messages: [],
  hasMoreMessages: false,
  user: null,
};
