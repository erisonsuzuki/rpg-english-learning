"use client";

import { useAppState } from "@/components/app-state";
import { useLabels } from "@/components/language-label";

export function ProfilePanel() {
  const { state, updateCharacter } = useAppState();
  const labels = useLabels();

  return (
    <section className="panel">
      <h2>{labels.characterTitle}</h2>
      <label htmlFor="character-name">{labels.characterFieldName}</label>
      <input
        id="character-name"
        placeholder={labels.characterPlaceholderName}
        value={state.character.name || ""}
        onChange={(event) => updateCharacter({ name: event.target.value })}
      />
      <label htmlFor="character-class">{labels.characterFieldClass}</label>
      <input
        id="character-class"
        placeholder={labels.characterPlaceholderClass}
        value={state.character.class || ""}
        onChange={(event) => updateCharacter({ class: event.target.value })}
      />
      <label htmlFor="character-backstory">{labels.characterFieldBackstory}</label>
      <textarea
        id="character-backstory"
        rows={4}
        placeholder={labels.characterPlaceholderBackstory}
        value={state.character.backstory || ""}
        onChange={(event) => updateCharacter({ backstory: event.target.value })}
      />
      <label htmlFor="character-stats">{labels.characterFieldStats}</label>
      <textarea
        id="character-stats"
        rows={3}
        placeholder={labels.characterPlaceholderStats}
        value={state.character.stats || ""}
        onChange={(event) => updateCharacter({ stats: event.target.value })}
      />
    </section>
  );
}
