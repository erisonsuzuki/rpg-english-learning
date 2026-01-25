"use client";

import type { ReactNode } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { AppStateProvider } from "@/components/app-state";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <NuqsAdapter>
      <AppStateProvider>{children}</AppStateProvider>
    </NuqsAdapter>
  );
}
