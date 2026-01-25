"use client";

import { AuthForm } from "@/components/auth-form";
import { useLabels } from "@/components/language-label";

export function LandingUnauth() {
  const labels = useLabels();

  return (
    <section className="landing-shell">
      <div className="panel landing-hero">
        <h2>{labels.landingTitle}</h2>
        <p className="helper-text landing-intro">{labels.landingIntro}</p>
        <div className="landing-actions">
          <h3>{labels.landingWhatYouDoTitle}</h3>
          <ul>
            <li>{labels.landingWhatYouDoStory}</li>
            <li>{labels.landingWhatYouDoCorrections}</li>
            <li>{labels.landingWhatYouDoVocabulary}</li>
          </ul>
        </div>
      </div>
      <aside className="panel landing-card">
        <h3>{labels.authTitle}</h3>
        <p className="helper-text">{labels.authIntro}</p>
        <AuthForm />
      </aside>
    </section>
  );
}
