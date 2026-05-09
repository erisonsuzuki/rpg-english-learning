"use client";

import type { ReactNode } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { SessionProvider } from "next-auth/react";
import { AppStateProvider } from "@/components/app-state";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <NuqsAdapter>
        <AppStateProvider>{children}</AppStateProvider>
      </NuqsAdapter>
    </SessionProvider>
  );
}
