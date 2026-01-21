import { CharacterBuilder } from "@/components/character-builder";
import { ProfilePanel } from "@/components/profile-panel";

export default function CharacterPage() {
  return (
    <section className="stacked-page">
      <ProfilePanel />
      <CharacterBuilder />
    </section>
  );
}
