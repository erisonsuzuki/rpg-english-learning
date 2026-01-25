"use client";

import { useMemo, useState } from "react";
import { useLabels } from "@/components/language-label";
import { getBrowserRuntime } from "@/lib/browser-runtime";
import { getEventTargetValue } from "@/lib/dom";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";

type AuthFormProps = {
  className?: string;
};

export function AuthForm({ className }: AuthFormProps) {
  const labels = useLabels();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [authStatus, setAuthStatus] = useState<
    "idle" | "loading" | "sent" | "error"
  >("idle");
  const [authError, setAuthError] = useState<string | null>(null);

  const sendMagicLink = async () => {
    const trimmed = email.trim();
    if (!trimmed || authStatus === "loading") return;
    setAuthStatus("loading");
    setAuthError(null);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const redirectUrl = siteUrl || getBrowserRuntime().location?.origin || "";
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    if (error) {
      setAuthStatus("error");
      setAuthError(error.message);
      return;
    }
    setAuthStatus("sent");
  };

  return (
    <div className={className ? `auth-form ${className}` : "auth-form"}>
      <label htmlFor="auth-email">{labels.authEmailLabel}</label>
      <input
        id="auth-email"
        type="email"
        placeholder={labels.authEmailPlaceholder}
        value={email}
        onChange={(event) => {
          setEmail(getEventTargetValue(event.target));
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
    </div>
  );
}
