"use client";

import { useMemo, useState } from "react";
import { useAppState } from "@/components/app-state";
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
  const [email, setEmail] = useState("");
  const [authStatus, setAuthStatus] = useState<
    "idle" | "loading" | "sent" | "error"
  >("idle");
  const [authError, setAuthError] = useState<string | null>(null);

  const isAuthenticated = Boolean(state.user);

  const sendMagicLink = async () => {
    const trimmed = email.trim();
    if (!trimmed || authStatus === "loading") return;
    setAuthStatus("loading");
    setAuthError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      setAuthStatus("error");
      setAuthError(error.message);
      return;
    }
    setAuthStatus("sent");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

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
        onChange={(event) => updateState({ uiLanguage: event.target.value })}
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
          updateState({ theme: event.target.value as (typeof THEMES)[number] })
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
          updateState({
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
        <>
          <label htmlFor="auth-email">{labels.authEmailLabel}</label>
          <input
            id="auth-email"
            type="email"
            placeholder={labels.authEmailPlaceholder}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (authStatus !== "idle") setAuthStatus("idle");
              if (authError) setAuthError(null);
            }}
          />
          <button
            type="button"
            onClick={sendMagicLink}
            disabled={authStatus === "loading" || !email.trim()}
          >
            {authStatus === "loading" ? labels.authSending : labels.authSendLink}
          </button>
          {authStatus === "sent" ? (
            <p className="helper-text">{labels.authCheckEmail}</p>
          ) : null}
          {authStatus === "error" && authError ? (
            <p className="form-error">{authError}</p>
          ) : null}
        </>
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
