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
  messages: [],
  hasMoreMessages: false,
  user: null,
};
