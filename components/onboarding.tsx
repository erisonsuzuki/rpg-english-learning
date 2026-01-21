"use client";

import { useAppState } from "@/components/app-state";
import { useLabels } from "@/components/language-label";

const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
const LANGUAGES = ["Portuguese", "English"] as const;

export function OnboardingPanel() {
  const { state, updateState } = useAppState();
  const labels = useLabels();

  if (state.hasOnboarded) {
    return null;
  }

  return (
    <section className="panel onboarding-panel">
      <h2>{labels.onboardingTitle}</h2>
      <p className="helper-text">{labels.onboardingIntro}</p>
      <label htmlFor="onboarding-level">{labels.levelLabel}</label>
      <select
        id="onboarding-level"
        value={state.level}
        onChange={(event) => updateState({ level: event.target.value })}
      >
        {LEVELS.map((level) => (
          <option key={level} value={level}>
            {level}
          </option>
        ))}
      </select>
      <label htmlFor="onboarding-language">{labels.languageLabel}</label>
      <select
        id="onboarding-language"
        value={state.uiLanguage}
        onChange={(event) => updateState({ uiLanguage: event.target.value })}
      >
        {LANGUAGES.map((language) => (
          <option key={language} value={language}>
            {language}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => updateState({ hasOnboarded: true })}
      >
        {labels.onboardingCta}
      </button>
    </section>
  );
}
