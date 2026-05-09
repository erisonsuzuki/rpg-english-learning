"use client";

import Link from "next/link";
import { useState } from "react";
import { LanguageLabel, useLabels } from "@/components/language-label";

export function Header() {
  const labels = useLabels();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const repoUrl = "https://github.com/erisonsuzuki/rpg-english-learning";

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
      <Link
        className="rpg-topbar__corner"
        href={repoUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Open GitHub repository"
      >
        <svg
          className="rpg-topbar__corner-mark"
          viewBox="0 0 24 24"
          role="img"
          focusable="false"
          aria-hidden="true"
        >
          <path
            d="M12 2a10 10 0 0 0-3.16 19.5c.5.1.68-.22.68-.48v-1.7c-2.78.6-3.37-1.17-3.37-1.17-.46-1.15-1.11-1.45-1.11-1.45-.9-.62.07-.61.07-.61 1 .07 1.52 1.02 1.52 1.02.88 1.5 2.3 1.07 2.86.82.1-.64.35-1.07.63-1.32-2.22-.25-4.55-1.1-4.55-4.9 0-1.08.38-1.96 1-2.65-.1-.24-.44-1.26.1-2.62 0 0 .83-.26 2.72 1a9.4 9.4 0 0 1 4.96 0c1.88-1.26 2.7-1 2.7-1 .55 1.36.2 2.38.11 2.62.63.69 1 1.57 1 2.65 0 3.8-2.34 4.64-4.57 4.88.36.3.69.9.69 1.82v2.7c0 .27.18.59.69.49A10 10 0 0 0 12 2Z"
            fill="currentColor"
          />
        </svg>
      </Link>
    </header>
  );
}
