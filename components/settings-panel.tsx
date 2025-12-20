"use client";

import { useAppState } from "@/components/app-state";
import { useLabels } from "@/components/language-label";

const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
const LANGUAGES = ["Portuguese", "English"] as const;

export function SettingsPanel() {
  const { state, updateState, resetConversation, clearMessages } = useAppState();
  const labels = useLabels();

  return (
    <section className="panel">
      <h2>{labels.settingsTitle}</h2>
      <label htmlFor="english-level">{labels.levelLabel}</label>
      <select
        id="english-level"
        value={state.level}
        onChange={(event) => updateState({ level: event.target.value })}
      >
        {LEVELS.map((level) => (
          <option key={level} value={level}>
            {level}
          </option>
        ))}
      </select>
      <label htmlFor="app-language">{labels.languageLabel}</label>
      <select
        id="app-language"
        value={state.uiLanguage}
        onChange={(event) => updateState({ uiLanguage: event.target.value })}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang} value={lang}>
            {lang}
          </option>
        ))}
      </select>
      <button type="button" onClick={resetConversation}>
        {labels.newConversation}
      </button>
      <button type="button" onClick={clearMessages}>
        {labels.clearChat}
      </button>
    </section>
  );
}
