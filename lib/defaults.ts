import type { AppState } from "@/lib/storage";

export const defaultState: AppState = {
  character: {
    name: "",
    class: "",
    backstory: "",
    stats: "",
  },
  level: "Intermediate",
  uiLanguage: "Portuguese",
  messages: [],
};
