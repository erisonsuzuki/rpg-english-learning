"use client";

import { ChatPanel } from "@/components/chat-panel";
import { useAppState } from "@/components/app-state";
import { LandingUnauth } from "@/components/landing-unauth";

export function HomeContent() {
  const { state } = useAppState();
  if (state.user) {
    return (
      <section className="app-body">
        <ChatPanel />
      </section>
    );
  }

  return <LandingUnauth />;
}
