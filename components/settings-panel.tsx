"use client";

import { useMemo } from "react";
import { useAppState } from "@/components/app-state";
import { AuthForm } from "@/components/auth-form";
import { InstallButton } from "@/components/install-button";
import { useLabels } from "@/components/language-label";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";

const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
const LANGUAGES = ["Portuguese", "English"] as const;
const THEMES = ["light", "dark"] as const;
const TEXT_SIZES = ["small", "medium", "large"] as const;

export function SettingsPanel() {
  const { state, updateState, resetConversation } = useAppState();
  const labels = useLabels();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const isAuthenticated = Boolean(state.user);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const updateStateWithVersionCheck = (next: Partial<typeof state>) => {
    updateState(next);
    window.dispatchEvent(new Event("app:check-version"));
  };

  return (
    <section className="panel">
      <h2>{labels.settingsTitle}</h2>
      <label htmlFor="english-level">{labels.levelLabel}</label>
      <select
        id="english-level"
        value={state.level}
        onChange={(event) =>
          updateStateWithVersionCheck({ level: event.target.value })
        }
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
        onChange={(event) =>
          updateStateWithVersionCheck({ uiLanguage: event.target.value })
        }
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
        onChange={(event) =>
          updateStateWithVersionCheck({
            theme: event.target.value as (typeof THEMES)[number],
          })
        }
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
        onChange={(event) =>
          updateStateWithVersionCheck({
            textSize: event.target.value as (typeof TEXT_SIZES)[number],
          })
        }
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
