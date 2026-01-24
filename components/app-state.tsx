"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import type { AppState } from "@/lib/storage";
import { defaultState } from "@/lib/defaults";
import { clearState, loadState, saveState } from "@/lib/storage";

type AppStateContextValue = {
  state: AppState;
  updateState: (next: Partial<AppState>) => void;
  updateCharacter: (next: Partial<AppState["character"]>) => void;
  addMessage: (message: AppState["messages"][number]) => void;
  removeMessageAt: (index: number) => void;
  clearMessages: () => void;
  resetConversation: () => void;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

let storeState: AppState = defaultState;
let hasLoaded = false;
const listeners = new Set<() => void>();

function getSnapshot() {
  if (typeof window === "undefined") return defaultState;
  return storeState;
}

function getServerSnapshot() {
  return defaultState;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function updateStore(next: AppState) {
  storeState = next;
  saveState(next);
  listeners.forEach((listener) => listener());
}

function updateStoreWith(updater: (prev: AppState) => AppState) {
  updateStore(updater(storeState));
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hasHydrated = useRef(false);

  useEffect(() => {
    if (!hasLoaded) {
      const stored = loadState();
      storeState = stored ? { ...defaultState, ...stored } : defaultState;
      hasLoaded = true;
      listeners.forEach((listener) => listener());
    }
    hasHydrated.current = true;
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = state.theme;
    }
  }, [state.theme]);

  const updateState = useCallback((next: Partial<AppState>) => {
    updateStoreWith((prev) => ({ ...prev, ...next }));
  }, []);

  const updateCharacter = useCallback(
    (next: Partial<AppState["character"]>) => {
      updateStoreWith((prev) => ({
        ...prev,
        character: { ...prev.character, ...next },
      }));
    },
    []
  );

  const addMessage = useCallback(
    (message: AppState["messages"][number]) => {
      updateStoreWith((prev) => ({
        ...prev,
        messages: [...prev.messages, message],
      }));
    },
    []
  );

  const removeMessageAt = useCallback((index: number) => {
    updateStoreWith((prev) => ({
      ...prev,
      messages: prev.messages.filter((_, itemIndex) => itemIndex !== index),
    }));
  }, []);

  const clearMessages = useCallback(() => {
    updateStoreWith((prev) => ({
      ...prev,
      messages: [],
    }));
  }, []);

  const resetConversation = useCallback(() => {
    clearState();
    updateStore(defaultState);
  }, []);

  const value = useMemo(
    () => ({
      state,
      updateState,
      updateCharacter,
      addMessage,
      removeMessageAt,
      clearMessages,
      resetConversation,
    }),
    [
      state,
      updateState,
      updateCharacter,
      addMessage,
      removeMessageAt,
      clearMessages,
      resetConversation,
    ]
  );

  useEffect(() => {
    // Avoid clearing persisted state before initial hydration completes.
    if (!hasHydrated.current) return;
    if (state.messages.length === 0) {
      clearState();
      saveState(state);
    }
  }, [state]);

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
