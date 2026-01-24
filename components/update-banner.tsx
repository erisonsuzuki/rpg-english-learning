"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { APP_VERSION } from "@/lib/app-version";
import { clearAppCaches, waitForInstalled } from "@/lib/sw-update";
import { useLabels } from "@/components/language-label";

type UpdateState = {
  available: boolean;
  busy: boolean;
};

const CHECK_THROTTLE_MS = 5 * 60 * 1000;

export function UpdateBanner() {
  const labels = useLabels();
  const [state, setState] = useState<UpdateState>({
    available: false,
    busy: false,
  });
  const lastCheckedRef = useRef(0);

  const checkVersion = useCallback(async () => {
    const now = Date.now();
    if (now - lastCheckedRef.current < CHECK_THROTTLE_MS) return;
    lastCheckedRef.current = now;
    try {
      const response = await fetch("/api/version", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { version?: string };
      if (data.version && data.version !== APP_VERSION) {
        setState((prev) => ({ ...prev, available: true }));
      }
    } catch {
      // Ignore version check failures.
    }
  }, []);

  useEffect(() => {
    if (state.available) return;
    const timer = window.setTimeout(() => {
      void checkVersion();
    }, 0);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void checkVersion();
      }
    }, CHECK_THROTTLE_MS);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void checkVersion();
      }
    };
    const handleManualCheck = () => {
      void checkVersion();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("app:check-version", handleManualCheck);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("app:check-version", handleManualCheck);
    };
  }, [checkVersion, state.available]);

  useEffect(() => {
    if (!state.available) return;
    navigator.serviceWorker
      ?.getRegistration()
      .then((registration) => registration?.update())
      .catch(() => null);
  }, [state.available]);

  const handleUpdate = async () => {
    setState((prev) => ({ ...prev, busy: true }));
    let reloaded = false;
    const reload = () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    };
    try {
      navigator.serviceWorker?.addEventListener("controllerchange", reload, {
        once: true,
      });
      const registration = await navigator.serviceWorker?.getRegistration();
      if (!registration) {
        await clearAppCaches();
        reload();
        return;
      }
      if (!navigator.serviceWorker?.controller) {
        await clearAppCaches();
        reload();
        return;
      }
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      } else {
        await registration.update();
        const installed = await waitForInstalled(registration.installing);
        installed?.postMessage({ type: "SKIP_WAITING" });
      }
      await clearAppCaches();
      window.setTimeout(reload, 8000);
    } catch {
      setState((prev) => ({ ...prev, busy: false }));
    }
  };

  if (!state.available) return null;

  return (
    <div className="update-banner" role="status" aria-live="polite">
      <span>{labels.updateAvailable}</span>
      <button
        type="button"
        className="update-banner__action"
        onClick={handleUpdate}
        disabled={state.busy}
      >
        {state.busy ? labels.updateRefreshing : labels.updateAction}
      </button>
    </div>
  );
}
