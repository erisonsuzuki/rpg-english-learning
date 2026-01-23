"use client";

import Link from "next/link";
import { LanguageLabel, useLabels } from "@/components/language-label";

export function Header() {
  const labels = useLabels();

  return (
    <header className="rpg-topbar">
      <LanguageLabel title="RPG English Learning" subtitle={labels.subtitle} />
      <nav className="rpg-nav">
        <Link href="/">{labels.headerStory}</Link>
        <Link href="/character">{labels.headerCharacter}</Link>
        <Link href="/settings">{labels.headerSettings}</Link>
      </nav>
    </header>
  );
}
