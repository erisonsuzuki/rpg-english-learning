import type { AppState } from "@/lib/app-state";

export const defaultState: AppState = {
  character: {
    name: "",
    class: "",
    backstory: "",
    stats: "",
    weakness: "",
  },
  llmSettings: {
    correctionStyle: "Teacher Mode",
    rpgTheme: "",
    learningGoal: "Conversation",
    narratorPersona: "Classic",
  },
  level: "Intermediate",
  uiLanguage: "English",
  correctionStyle: "Teacher Mode",
  rpgTheme: "",
  learningGoal: "Conversation",
  narratorPersona: "Classic",
  theme: "dark",
  textSize: "medium",
  messages: [],
  hasMoreMessages: false,
  user: null,
};
