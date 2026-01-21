"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AppState } from "@/lib/storage";
import { defaultState } from "@/lib/defaults";
import { clearState, loadState, saveState } from "@/lib/storage";

type AppStateContextValue = {
  state: AppState;
  updateState: (next: Partial<AppState>) => void;
  updateCharacter: (next: Partial<AppState["character"]>) => void;
  addMessage: (message: AppState["messages"][number]) => void;
  clearMessages: () => void;
  resetConversation: () => void;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<AppState>(() => {
    if (typeof window === "undefined") {
      return defaultState;
    }
    const stored = loadState();
    return stored ? { ...defaultState, ...stored } : defaultState;
  });

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const updateState = useCallback((next: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...next }));
  }, []);

  const updateCharacter = useCallback((next: Partial<AppState["character"]>) => {
    setState((prev) => ({
      ...prev,
      character: { ...prev.character, ...next },
    }));
  }, []);

  const addMessage = useCallback((message: AppState["messages"][number]) => {
    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  }, []);

  const clearMessages = useCallback(() => {
    setState((prev) => ({ ...prev, messages: [] }));
  }, []);

  const resetConversation = useCallback(() => {
    setState((prev) => ({
      ...prev,
      messages: [],
    }));
  }, []);

  const value = useMemo(
    () => ({
      state,
      updateState,
      updateCharacter,
      addMessage,
      clearMessages,
      resetConversation,
    }),
    [state, updateState, updateCharacter, addMessage, clearMessages, resetConversation]
  );

  useEffect(() => {
    if (state.messages.length === 0) {
      clearState();
      saveState(state);
    }
  }, [state]);

  if (!hydrated) {
    return null;
  }

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return context;
}
