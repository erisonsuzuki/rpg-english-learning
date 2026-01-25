"use client";

import { CharacterBuilder } from "@/components/character-builder";
import { LandingUnauth } from "@/components/landing-unauth";
import { ProfilePanel } from "@/components/profile-panel";
import { useAppState } from "@/components/app-state";

export default function CharacterPage() {
  const { state } = useAppState();

  if (!state.user) {
    return <LandingUnauth />;
  }

  return (
    <section className="stacked-page">
      <ProfilePanel />
      <CharacterBuilder />
    </section>
  );
}
