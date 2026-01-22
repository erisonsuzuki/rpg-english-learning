"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
  clearMessages: () => void;
  resetConversation: () => void;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

let storeState: AppState = defaultState;
let hasLoaded = false;
const listeners = new Set<() => void>();

function getSnapshot() {
  if (typeof window === "undefined") return defaultState;
  if (!hasLoaded) {
    const stored = loadState();
    storeState = stored ? { ...defaultState, ...stored } : defaultState;
    hasLoaded = true;
  }
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

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = state.theme;
    }
  }, [state.theme]);

  const updateState = useCallback(
    (next: Partial<AppState>) => {
      updateStore({ ...state, ...next });
    },
    [state]
  );

  const updateCharacter = useCallback(
    (next: Partial<AppState["character"]>) => {
      updateStore({
        ...state,
        character: { ...state.character, ...next },
      });
    },
    [state]
  );

  const addMessage = useCallback(
    (message: AppState["messages"][number]) => {
      updateStore({
        ...state,
        messages: [...state.messages, message],
      });
    },
    [state]
  );

  const clearMessages = useCallback(() => {
    updateStore({
      ...state,
      messages: [],
    });
  }, [state]);

  const resetConversation = useCallback(() => {
    updateStore({
      ...state,
      messages: [],
    });
  }, [state]);

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
