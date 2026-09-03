"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import type { AppState } from "@/lib/app-state";
import type { UserSettings } from "@/lib/types";
import { getBrowserRuntime } from "@/lib/browser-runtime";
import { defaultState } from "@/lib/defaults";

type AppStateContextValue = { state: AppState; updateState: (next: Partial<AppState>) => void; updateCharacter: (next: Partial<AppState["character"]>) => void; updateLlmSettings: (next: Partial<AppState["llmSettings"]>) => void; addMessage: (message: AppState["messages"][number], options?: { persist?: boolean }) => void; removeMessageAt: (index: number, options?: { persist?: boolean }) => void; persistPendingMessages: () => Promise<void>; loadMoreMessages: () => Promise<void>; clearMessages: () => void; resetConversation: () => void };
const AppStateContext = createContext<AppStateContextValue | null>(null);
let storeState: AppState = defaultState;
const listeners = new Set<() => void>();
const updateStore = (next: AppState) => { storeState = next; listeners.forEach((listener) => listener()); };
const updateStoreWith = (updater: (previous: AppState) => AppState) => updateStore(updater(storeState));
const subscribe = (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener); };
const stateApi = async (action: string, payload: unknown = {}) => {
  const response = await fetch("/api/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, payload }) });
  if (!response.ok) throw new Error("State request failed");
  return response.json();
};

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(subscribe, () => storeState, () => defaultState);
  const hydrating = useRef(false);
  const settingsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistSettings = useCallback((settings: UserSettings) => {
    if (!storeState.user || hydrating.current) return;
    if (settingsTimer.current) clearTimeout(settingsTimer.current);
    settingsTimer.current = setTimeout(() => void stateApi("save_settings", settings).catch((error) => console.warn("Failed to persist settings", error)), 500);
  }, []);
  const hydrate = useCallback(async () => {
    const session = await fetch("/api/auth/session", { cache: "no-store" }).then((response) => response.json());
    const user = session.user as AppState["user"];
    updateStoreWith((previous) => ({ ...previous, user }));
    if (!user) return;
    hydrating.current = true;
    try {
       const data = await fetch("/api/state?offset=0", { cache: "no-store" }).then((response): Promise<Record<string, any>> => response.ok ? response.json() : Promise.resolve({}));
      const settings = data.settings;
      const character = data.character;
       const messages = [...(data.messages ?? [])].reverse().map((message) => ({ id: message.id, role: message.role, content: message.content, provider: message.provider ?? undefined, model: message.model ?? undefined }));
       updateStoreWith((previous) => ({ ...previous, user, character: character ?? defaultState.character, messages, hasMoreMessages: data.hasMoreMessages === true, level: settings?.level ?? previous.level, uiLanguage: settings?.ui_language ?? previous.uiLanguage, theme: settings?.theme ?? previous.theme, textSize: settings?.text_size ?? previous.textSize, correctionStyle: settings?.correction_style ?? previous.correctionStyle, rpgTheme: settings?.rpg_theme ?? previous.rpgTheme, learningGoal: settings?.learning_goal ?? previous.learningGoal, narratorPersona: settings?.narrator_persona ?? previous.narratorPersona, llmSettings: settings ? { correctionStyle: settings.correction_style, rpgTheme: settings.rpg_theme, learningGoal: settings.learning_goal, narratorPersona: settings.narrator_persona } : previous.llmSettings }));
    } finally { hydrating.current = false; }
  }, []);
  useEffect(() => { void hydrate(); }, [hydrate]);
  useEffect(() => { const documentElement = getBrowserRuntime().document?.documentElement; if (documentElement?.dataset) documentElement.dataset.theme = state.theme; }, [state.theme]);
  const updateState = useCallback((next: Partial<AppState>) => {
    updateStoreWith((previous) => ({ ...previous, ...next }));
    if (["level", "uiLanguage", "theme", "textSize", "correctionStyle", "rpgTheme", "learningGoal", "narratorPersona"].some((key) => key in next)) persistSettings({ level: storeState.level, uiLanguage: storeState.uiLanguage, theme: storeState.theme, textSize: storeState.textSize, correctionStyle: storeState.correctionStyle, rpgTheme: storeState.rpgTheme, learningGoal: storeState.learningGoal, narratorPersona: storeState.narratorPersona });
  }, [persistSettings]);
  const updateLlmSettings = useCallback((next: Partial<AppState["llmSettings"]>) => updateState({ ...next, llmSettings: { ...storeState.llmSettings, ...next } }), [updateState]);
  const updateCharacter = useCallback((next: Partial<AppState["character"]>) => { const character = { ...storeState.character, ...next }; updateStoreWith((previous) => ({ ...previous, character })); if (storeState.user && !hydrating.current) void stateApi("save_character", character).catch((error) => console.warn("Failed to persist character", error)); }, []);
  const addMessage = useCallback((message: AppState["messages"][number], options?: { persist?: boolean }) => { updateStoreWith((previous) => ({ ...previous, messages: [...previous.messages, message] })); if (storeState.user && !hydrating.current && (options?.persist ?? true)) void stateApi("add_message", message).then((saved) => { if (saved?.id) updateStoreWith((previous) => ({ ...previous, messages: previous.messages.map((item) => item === message ? { ...item, id: saved.id } : item) })); }).catch((error) => console.warn("Failed to persist message", error)); }, []);
  const removeMessageAt = useCallback((index: number, options?: { persist?: boolean }) => { const message = storeState.messages[index]; updateStoreWith((previous) => ({ ...previous, messages: previous.messages.filter((_item, itemIndex) => itemIndex !== index) })); if (message?.id && storeState.user && (options?.persist ?? true)) void stateApi("delete_message", { id: message.id }); }, []);
  const clearMessages = useCallback(() => { updateStoreWith((previous) => ({ ...previous, messages: [], hasMoreMessages: false })); if (storeState.user) void stateApi("clear_messages"); }, []);
  const resetConversation = useCallback(() => { const user = storeState.user; updateStore({ ...defaultState, user, level: storeState.level, uiLanguage: storeState.uiLanguage, theme: storeState.theme, textSize: storeState.textSize, correctionStyle: storeState.correctionStyle, rpgTheme: storeState.rpgTheme, learningGoal: storeState.learningGoal, narratorPersona: storeState.narratorPersona, llmSettings: storeState.llmSettings }); if (user) { void stateApi("clear_messages"); void stateApi("clear_character"); } }, []);
  const persistPendingMessages = useCallback(async () => {
    const pending = storeState.messages.filter((message) => !message.id);
    for (const message of pending) {
      const saved = await stateApi("add_message", { role: message.role, content: message.content, ...(message.provider ? { provider: message.provider } : {}), ...(message.model ? { model: message.model } : {}) });
      if (saved?.id) updateStoreWith((previous) => ({ ...previous, messages: previous.messages.map((item) => item === message ? { ...item, id: saved.id } : item) }));
    }
  }, []);
  const loadMoreMessages = useCallback(async () => {
    const offset = storeState.messages.filter((message) => message.id).length;
    const response = await fetch(`/api/state?offset=${offset}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to load messages");
    const data = await response.json() as Record<string, any>;
    const messages = [...(data.messages ?? [])].reverse().map((message) => ({ id: message.id, role: message.role, content: message.content, provider: message.provider ?? undefined, model: message.model ?? undefined }));
    updateStoreWith((previous) => ({ ...previous, messages: [...messages, ...previous.messages], hasMoreMessages: data.hasMoreMessages === true }));
  }, []);
  const value = useMemo(() => ({ state, updateState, updateCharacter, updateLlmSettings, addMessage, removeMessageAt, persistPendingMessages, loadMoreMessages, clearMessages, resetConversation }), [state, updateState, updateCharacter, updateLlmSettings, addMessage, removeMessageAt, persistPendingMessages, loadMoreMessages, clearMessages, resetConversation]);
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
export function useAppState() { const context = useContext(AppStateContext); if (!context) throw new Error("useAppState must be used within AppStateProvider"); return context; }
