"use client";

import { ReviewPanel } from "@/components/review-panel";
import { useAppState } from "@/components/app-state";
import { LandingUnauth } from "@/components/landing-unauth";

export function ReviewContent() {
  const { state } = useAppState();
  if (state.user) {
    return (
      <section className="app-body">
        <ReviewPanel />
      </section>
    );
  }

  return <LandingUnauth />;
}
