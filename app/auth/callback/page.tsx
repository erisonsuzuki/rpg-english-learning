"use client";

import { useEffect, useState } from "react";
import { getBrowserRuntime } from "@/lib/browser-runtime";

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{ token: string | null; nonce: string | null }>({ token: null, nonce: null });
  useEffect(() => {
    const runtime = getBrowserRuntime();
    const params = new URLSearchParams(runtime.location?.hash?.slice(1));
    if (runtime.location?.hash) runtime.history?.replaceState?.(null, "", `${runtime.location.pathname}${runtime.location.search}`);
    queueMicrotask(() => setCredentials({ token: params.get("token"), nonce: params.get("nonce") }));
  }, []);
  const continueSignIn = async () => {
    const runtime = getBrowserRuntime();
    const response = await fetch("/api/auth/consume", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(credentials) });
    if (response.ok) runtime.location?.assign?.("/");
    else setStatus("Este link não é mais válido. Solicite um novo link de acesso.");
  };
  return <section className="panel"><h2>Confirmar acesso</h2><p>Quando estiver pronto, continue para entrar no RPG English Learning.</p><button type="button" onClick={continueSignIn}>Continuar</button>{status ? <p className="form-error">{status}</p> : null}</section>;
}
