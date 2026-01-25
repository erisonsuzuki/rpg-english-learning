"use client";

import type { ChangeEvent } from "react";
import type { AppState } from "@/lib/app-state";
import { useCallback, useEffect, useMemo } from "react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useAppState } from "@/components/app-state";
import { AuthForm } from "@/components/auth-form";
import { InstallButton } from "@/components/install-button";
import { useLabels } from "@/components/language-label";
import { getBrowserRuntime } from "@/lib/browser-runtime";
import { getEventTargetValue } from "@/lib/dom";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";

const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
const LANGUAGES = ["Portuguese", "English"] as const;
const THEMES = ["light", "dark"] as const;
const TEXT_SIZES = ["small", "medium", "large"] as const;
const CORRECTION_STYLES = [
  "Narrative Flow",
  "Teacher Mode",
  "Perfectionist",
] as const;
const LEARNING_GOALS = ["Basics", "Conversation", "Reading"] as const;
const NARRATOR_PERSONAS = ["Classic", "Mystery", "Humor"] as const;

const levelParser = parseAsStringLiteral(LEVELS);
const languageParser = parseAsStringLiteral(LANGUAGES);
const themeParser = parseAsStringLiteral(THEMES);
const textSizeParser = parseAsStringLiteral(TEXT_SIZES);

export function SettingsPanel() {
  const { state, updateState, updateLlmSettings, resetConversation } = useAppState();
  const labels = useLabels();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [levelQuery, setLevelQuery] = useQueryState("level", levelParser);
  const [languageQuery, setLanguageQuery] = useQueryState(
    "lang",
    languageParser
  );
  const [themeQuery, setThemeQuery] = useQueryState("theme", themeParser);
  const [textSizeQuery, setTextSizeQuery] = useQueryState(
    "text",
    textSizeParser
  );

  const isAuthenticated = Boolean(state.user);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const updateStateWithVersionCheck = useCallback(
    (next: Partial<typeof state>) => {
      updateState(next);
      getBrowserRuntime().dispatchEvent?.(new Event("app:check-version"));
    },
    [updateState]
  );

  const handleLevelChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextLevel = (getEventTargetValue(event.target) || state.level) as (
      typeof LEVELS
    )[number];
    updateStateWithVersionCheck({ level: nextLevel });
    void setLevelQuery(nextLevel);
  };

  const handleLanguageChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextLang = (getEventTargetValue(event.target) || state.uiLanguage) as (
      typeof LANGUAGES
    )[number];
    updateStateWithVersionCheck({ uiLanguage: nextLang });
    void setLanguageQuery(nextLang);
  };

  const handleThemeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextTheme = (getEventTargetValue(event.target) || state.theme) as (
      typeof THEMES
    )[number];
    updateStateWithVersionCheck({ theme: nextTheme });
    void setThemeQuery(nextTheme);
  };

  const handleTextSizeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextSize = (
      getEventTargetValue(event.target) || state.textSize
    ) as (typeof TEXT_SIZES)[number];
    updateStateWithVersionCheck({ textSize: nextSize });
    void setTextSizeQuery(nextSize);
  };

  const updateLlmSettingsWithVersionCheck = useCallback(
    (next: Partial<NonNullable<AppState["llmSettings"]>>) => {
      updateLlmSettings(next ?? {});
      getBrowserRuntime().dispatchEvent?.(new Event("app:check-version"));
    },
    [updateLlmSettings]
  );

  const handleCorrectionStyleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextStyle = (
      getEventTargetValue(event.target) || state.correctionStyle
    ) as (typeof CORRECTION_STYLES)[number];
    updateLlmSettingsWithVersionCheck({ correctionStyle: nextStyle });
  };

  const handleLearningGoalChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextGoal = (
      getEventTargetValue(event.target) || state.learningGoal
    ) as (typeof LEARNING_GOALS)[number];
    updateLlmSettingsWithVersionCheck({ learningGoal: nextGoal });
  };

  const handleNarratorPersonaChange = (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    const nextPersona = (
      getEventTargetValue(event.target) || state.narratorPersona
    ) as (typeof NARRATOR_PERSONAS)[number];
    updateLlmSettingsWithVersionCheck({ narratorPersona: nextPersona });
  };

  useEffect(() => {
    if (levelQuery && levelQuery !== state.level) {
      updateStateWithVersionCheck({ level: levelQuery });
    }
  }, [levelQuery, state.level, updateStateWithVersionCheck]);

  useEffect(() => {
    if (languageQuery && languageQuery !== state.uiLanguage) {
      updateStateWithVersionCheck({ uiLanguage: languageQuery });
    }
  }, [languageQuery, state.uiLanguage, updateStateWithVersionCheck]);

  useEffect(() => {
    if (themeQuery && themeQuery !== state.theme) {
      updateStateWithVersionCheck({ theme: themeQuery });
    }
  }, [themeQuery, state.theme, updateStateWithVersionCheck]);

  useEffect(() => {
    if (textSizeQuery && textSizeQuery !== state.textSize) {
      updateStateWithVersionCheck({ textSize: textSizeQuery });
    }
  }, [textSizeQuery, state.textSize, updateStateWithVersionCheck]);

  return (
    <section className="panel">
      <h2>{labels.settingsTitle}</h2>
      <h3>{labels.authTitle}</h3>
      {!isAuthenticated ? (
        <p className="helper-text">{labels.authIntro}</p>
      ) : null}
      {isAuthenticated ? (
        <p className="helper-text">
          {labels.authSignedInAs} {state.user?.email || labels.authUnknownUser}
        </p>
      ) : (
        <AuthForm />
      )}
      {isAuthenticated ? (
        <button type="button" onClick={handleSignOut}>
          {labels.authSignOut}
        </button>
      ) : null}
      <h3>{labels.settingsGeneralTitle}</h3>
      <label htmlFor="english-level">{labels.levelLabel}</label>
      <select
        id="english-level"
        value={state.level}
        onChange={handleLevelChange}
      >
        {LEVELS.map((level) => (
          <option key={level} value={level}>
            {level === "Beginner"
              ? labels.levelBeginner
              : level === "Intermediate"
                ? labels.levelIntermediate
                : labels.levelAdvanced}
          </option>
        ))}
      </select>
      <label htmlFor="app-language">{labels.languageLabel}</label>
      <select
        id="app-language"
        value={state.uiLanguage}
        onChange={handleLanguageChange}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang} value={lang}>
            {lang === "English"
              ? labels.languageOptionEnglish
              : labels.languageOptionPortuguese}
          </option>
        ))}
      </select>
      <label htmlFor="app-theme">{labels.themeLabel}</label>
      <select
        id="app-theme"
        value={state.theme}
        onChange={handleThemeChange}
      >
        {THEMES.map((theme) => (
          <option key={theme} value={theme}>
            {theme === "dark" ? labels.themeDark : labels.themeLight}
          </option>
        ))}
      </select>
      <label htmlFor="text-size">{labels.textSizeLabel}</label>
      <select
        id="text-size"
        value={state.textSize}
        onChange={handleTextSizeChange}
      >
        {TEXT_SIZES.map((size) => (
          <option key={size} value={size}>
            {size === "small"
              ? labels.textSizeSmall
              : size === "large"
                ? labels.textSizeLarge
                : labels.textSizeMedium}
          </option>
        ))}
      </select>
      {isAuthenticated ? (
        <>
          <h3>{labels.llmSettingsTitle}</h3>
          <label htmlFor="correction-style">{labels.correctionStyleLabel}</label>
          <select
            id="correction-style"
            value={state.correctionStyle}
            onChange={handleCorrectionStyleChange}
          >
            {CORRECTION_STYLES.map((style) => (
              <option key={style} value={style}>
                {style === "Narrative Flow"
                  ? labels.correctionStyleOptionNarrative
                  : style === "Perfectionist"
                    ? labels.correctionStyleOptionPerfectionist
                    : labels.correctionStyleOptionTeacher}
              </option>
            ))}
          </select>
          <label htmlFor="learning-goal">{labels.learningGoalLabel}</label>
          <select
            id="learning-goal"
            value={state.learningGoal}
            onChange={handleLearningGoalChange}
          >
            {LEARNING_GOALS.map((goal) => (
              <option key={goal} value={goal}>
                {goal === "Basics"
                  ? labels.learningGoalOptionBasics
                  : goal === "Reading"
                    ? labels.learningGoalOptionReading
                    : labels.learningGoalOptionConversation}
              </option>
            ))}
          </select>
          <label htmlFor="narrator-persona">{labels.narratorPersonaLabel}</label>
          <select
            id="narrator-persona"
            value={state.narratorPersona}
            onChange={handleNarratorPersonaChange}
          >
            {NARRATOR_PERSONAS.map((persona) => (
              <option key={persona} value={persona}>
                {persona === "Mystery"
                  ? labels.narratorPersonaOptionMystery
                  : persona === "Humor"
                    ? labels.narratorPersonaOptionHumor
                    : labels.narratorPersonaOptionClassic}
              </option>
            ))}
          </select>
          <label htmlFor="rpg-theme">{labels.rpgThemeLabel}</label>
          <input
            id="rpg-theme"
            value={state.rpgTheme}
            placeholder={labels.rpgThemePlaceholder}
            onChange={(event) => {
              updateLlmSettingsWithVersionCheck({
                rpgTheme: getEventTargetValue(event.target),
              });
            }}
          />
        </>
      ) : null}
      <button type="button" onClick={resetConversation}>
        {labels.clearData}
      </button>
      <InstallButton />
    </section>
  );
}
