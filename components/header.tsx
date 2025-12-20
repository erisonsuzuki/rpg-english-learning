"use client";

import { LanguageLabel, useLabels } from "@/components/language-label";

export function Header() {
  const labels = useLabels();

  return (
    <header className="app-header">
      <LanguageLabel title="RPG English Learning" subtitle={labels.subtitle} />
    </header>
  );
}
