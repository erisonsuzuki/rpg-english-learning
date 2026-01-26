"use client";

import Link from "next/link";
import { useState } from "react";
import { LanguageLabel, useLabels } from "@/components/language-label";

export function Header() {
  const labels = useLabels();
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <header className="rpg-topbar">
      <div className="rpg-topbar__bar">
        <LanguageLabel title="RPG English Learning" subtitle={labels.subtitle} />
        <button
          className="rpg-nav-toggle"
          type="button"
          aria-controls="rpg-nav"
          aria-expanded={isNavOpen}
          onClick={() => setIsNavOpen((prev) => !prev)}
          aria-label="Toggle navigation"
        >
          <span className="rpg-nav-toggle__bar" />
          <span className="rpg-nav-toggle__bar" />
          <span className="rpg-nav-toggle__bar" />
        </button>
      </div>
      <nav className={`rpg-nav${isNavOpen ? " is-open" : ""}`} id="rpg-nav">
        <Link href="/" onClick={() => setIsNavOpen(false)}>
          {labels.headerStory}
        </Link>
        <Link href="/review" onClick={() => setIsNavOpen(false)}>
          {labels.headerReview}
        </Link>
        <Link href="/character" onClick={() => setIsNavOpen(false)}>
          {labels.headerCharacter}
        </Link>
        <Link href="/settings" onClick={() => setIsNavOpen(false)}>
          {labels.headerSettings}
        </Link>
      </nav>
    </header>
  );
}
