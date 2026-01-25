"use client";

import { useEffect, useState } from "react";
import { useLabels } from "@/components/language-label";
import { getBrowserRuntime } from "@/lib/browser-runtime";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function InstallButton() {
  const labels = useLabels();
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(
    null
  );

  useEffect(() => {
    const root = getBrowserRuntime();
    const handler = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };

    root.addEventListener?.("beforeinstallprompt", handler);
    return () => root.removeEventListener?.("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  };

  if (!promptEvent) {
    return null;
  }

  return (
    <button type="button" onClick={handleInstall}>
      {labels.installLabel}
    </button>
  );
}
