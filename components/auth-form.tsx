"use client";

import { useState } from "react";
import { useLabels } from "@/components/language-label";
import { getEventTargetValue } from "@/lib/dom";

type AuthFormProps = {
  className?: string;
};

export function AuthForm({ className }: AuthFormProps) {
  const labels = useLabels();
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
    const response = await fetch("/api/auth/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: trimmed }) });
    if (!response.ok) {
      setAuthStatus("error");
      setAuthError("Não foi possível solicitar o link. Tente novamente.");
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
