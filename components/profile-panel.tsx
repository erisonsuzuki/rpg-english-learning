"use client";

import { useAppState } from "@/components/app-state";
import { useLabels } from "@/components/language-label";
import { getEventTargetValue } from "@/lib/dom";

export function ProfilePanel() {
  const { state, updateCharacter } = useAppState();
  const labels = useLabels();
  const isAuthenticated = Boolean(state.user);

  return (
    <section className="panel">
      <h2>{labels.characterTitle}</h2>
      {!isAuthenticated ? (
        <p className="helper-text">{labels.authRequired}</p>
      ) : null}
      <label htmlFor="character-name">{labels.characterFieldName}</label>
      <input
        id="character-name"
        placeholder={labels.characterPlaceholderName}
        value={state.character.name || ""}
        onChange={(event) => {
          updateCharacter({ name: getEventTargetValue(event.target) });
        }}
        disabled={!isAuthenticated}
      />
      <label htmlFor="character-class">{labels.characterFieldClass}</label>
      <input
        id="character-class"
        placeholder={labels.characterPlaceholderClass}
        value={state.character.class || ""}
        onChange={(event) => {
          updateCharacter({ class: getEventTargetValue(event.target) });
        }}
        disabled={!isAuthenticated}
      />
      <label htmlFor="character-backstory">{labels.characterFieldBackstory}</label>
      <textarea
        id="character-backstory"
        rows={4}
        placeholder={labels.characterPlaceholderBackstory}
        value={state.character.backstory || ""}
        onChange={(event) => {
          updateCharacter({ backstory: getEventTargetValue(event.target) });
        }}
        disabled={!isAuthenticated}
      />
      <label htmlFor="character-weakness">{labels.characterFieldWeakness}</label>
      <input
        id="character-weakness"
        placeholder={labels.characterPlaceholderWeakness}
        value={state.character.weakness || ""}
        onChange={(event) => {
          updateCharacter({ weakness: getEventTargetValue(event.target) });
        }}
        disabled={!isAuthenticated}
      />
      <label htmlFor="character-stats">{labels.characterFieldStats}</label>
      <textarea
        id="character-stats"
        rows={3}
        placeholder={labels.characterPlaceholderStats}
        value={state.character.stats || ""}
        onChange={(event) => {
          updateCharacter({ stats: getEventTargetValue(event.target) });
        }}
        disabled={!isAuthenticated}
      />
    </section>
  );
}
