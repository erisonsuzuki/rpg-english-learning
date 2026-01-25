"use client";

import type { ChangeEvent } from "react";
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

const levelParser = parseAsStringLiteral(LEVELS);
const languageParser = parseAsStringLiteral(LANGUAGES);
const themeParser = parseAsStringLiteral(THEMES);
const textSizeParser = parseAsStringLiteral(TEXT_SIZES);

export function SettingsPanel() {
  const { state, updateState, resetConversation } = useAppState();
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
      <button type="button" onClick={resetConversation}>
        {labels.clearData}
      </button>
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
      <InstallButton />
    </section>
  );
}
