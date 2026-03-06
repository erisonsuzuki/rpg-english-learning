import type { AppState } from "@/lib/app-state";
import type { UserSettings } from "@/lib/types";

export const defaultSettings: UserSettings = {
  level: "Intermediate",
  uiLanguage: "English",
  theme: "dark",
  textSize: "medium",
  correctionStyle: "Teacher Mode",
  rpgTheme: "",
  learningGoal: "Conversation",
  narratorPersona: "Classic",
};

export const defaultState: AppState = {
  character: {
    name: "",
    class: "",
    backstory: "",
    stats: "",
    weakness: "",
  },
  llmSettings: {
    correctionStyle: defaultSettings.correctionStyle,
    rpgTheme: defaultSettings.rpgTheme,
    learningGoal: defaultSettings.learningGoal,
    narratorPersona: defaultSettings.narratorPersona,
  },
  level: defaultSettings.level,
  uiLanguage: defaultSettings.uiLanguage,
  correctionStyle: defaultSettings.correctionStyle,
  rpgTheme: defaultSettings.rpgTheme,
  learningGoal: defaultSettings.learningGoal,
  narratorPersona: defaultSettings.narratorPersona,
  theme: defaultSettings.theme,
  textSize: defaultSettings.textSize,
  messages: [],
  hasMoreMessages: false,
  user: null,
};
