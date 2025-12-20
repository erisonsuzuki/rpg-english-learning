"use client";

import { useAppState } from "@/components/app-state";
import { useLabels } from "@/components/language-label";

export function ProfilePanel() {
  const { state, updateCharacter } = useAppState();
  const labels = useLabels();

  return (
    <section className="panel">
      <h2>{labels.characterTitle}</h2>
      <label htmlFor="character-name">Name</label>
      <input
        id="character-name"
        placeholder="Aria Moonwind"
        value={state.character.name || ""}
        onChange={(event) => updateCharacter({ name: event.target.value })}
      />
      <label htmlFor="character-class">Class</label>
      <input
        id="character-class"
        placeholder="Ranger"
        value={state.character.class || ""}
        onChange={(event) => updateCharacter({ class: event.target.value })}
      />
      <label htmlFor="character-backstory">Backstory</label>
      <textarea
        id="character-backstory"
        rows={4}
        placeholder="A traveler from the misty north..."
        value={state.character.backstory || ""}
        onChange={(event) => updateCharacter({ backstory: event.target.value })}
      />
      <label htmlFor="character-stats">Stats</label>
      <textarea
        id="character-stats"
        rows={3}
        placeholder="Strength: 8, Wisdom: 12"
        value={state.character.stats || ""}
        onChange={(event) => updateCharacter({ stats: event.target.value })}
      />
    </section>
  );
}
