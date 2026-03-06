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
import type { AppState } from "@/lib/app-state";
import type { UserSettings } from "@/lib/types";
import { getBrowserRuntime } from "@/lib/browser-runtime";
import { defaultState } from "@/lib/defaults";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";
import type { Session } from "@supabase/supabase-js";
import {
  clearMessages as clearMessagesStore,
  deleteMessageById,
  fetchMessages,
  insertMessage,
  insertMessages,
} from "@/lib/supabase/messages";
import {
  clearCharacter,
  fetchCharacter,
  upsertCharacter,
} from "@/lib/supabase/character";
import {
  fetchUserSettings,
  upsertUserSettings,
} from "@/lib/supabase/user-settings";

type AppStateContextValue = {
  state: AppState;
  updateState: (next: Partial<AppState>) => void;
  updateCharacter: (next: Partial<AppState["character"]>) => void;
  updateLlmSettings: (next: Partial<AppState["llmSettings"]>) => void;
  addMessage: (
    message: AppState["messages"][number],
    options?: { persist?: boolean }
  ) => void;
  removeMessageAt: (index: number, options?: { persist?: boolean }) => void;
  persistPendingMessages: () => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  clearMessages: () => void;
  resetConversation: () => void;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

let storeState: AppState = defaultState;
const listeners = new Set<() => void>();
const MESSAGE_PAGE_SIZE = 50;

function getSnapshot() {
  const root = getBrowserRuntime();
  if (!root.document) {
    return defaultState;
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
  listeners.forEach((listener) => listener());
}

function updateStoreWith(updater: (prev: AppState) => AppState) {
  updateStore(updater(storeState));
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hasHydrated = useRef(false);
  const isHydrating = useRef(false);
  const settingsPersistTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const pendingSettings = useRef<UserSettings | null>(null);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const getUserSettingsSnapshot = useCallback((): UserSettings => {
    return {
      level: storeState.level,
      uiLanguage: storeState.uiLanguage,
      theme: storeState.theme,
      textSize: storeState.textSize,
      correctionStyle: storeState.correctionStyle,
      rpgTheme: storeState.rpgTheme,
      learningGoal: storeState.learningGoal,
      narratorPersona: storeState.narratorPersona,
    };
  }, []);

  const scheduleSettingsPersist = useCallback(
    (settings: UserSettings) => {
      const userId = storeState.user?.id;
      if (!userId || isHydrating.current) return;
      pendingSettings.current = settings;
      if (settingsPersistTimeout.current) {
        clearTimeout(settingsPersistTimeout.current);
      }
      settingsPersistTimeout.current = setTimeout(() => {
        const activeUserId = storeState.user?.id;
        const nextSettings = pendingSettings.current;
        if (!activeUserId || activeUserId !== userId || !nextSettings) return;
        void upsertUserSettings(supabase, activeUserId, nextSettings).catch(
          (error) => {
            console.warn("Failed to persist user settings", error);
          }
        );
      }, 500);
    },
    [supabase]
  );

  const hydrateUserData = useCallback(
    async (userId: string) => {
      isHydrating.current = true;
      try {
        const [character, messages, settings] = await Promise.all([
          fetchCharacter(supabase, userId),
          fetchMessages(supabase, userId, { limit: MESSAGE_PAGE_SIZE + 1 }),
          fetchUserSettings(supabase, userId),
        ]);
        const slicedMessages = (messages ?? []).slice(0, MESSAGE_PAGE_SIZE);
        updateStoreWith((prev) => ({
          ...prev,
          character: character ?? defaultState.character,
          level: settings?.level ?? prev.level,
          uiLanguage: settings?.uiLanguage ?? prev.uiLanguage,
          theme: settings?.theme ?? prev.theme,
          textSize: settings?.textSize ?? prev.textSize,
          llmSettings: settings
            ? {
                correctionStyle: settings.correctionStyle,
                rpgTheme: settings.rpgTheme,
                learningGoal: settings.learningGoal,
                narratorPersona: settings.narratorPersona,
              }
            : prev.llmSettings,
          correctionStyle: settings?.correctionStyle ?? prev.correctionStyle,
          rpgTheme: settings?.rpgTheme ?? prev.rpgTheme,
          learningGoal: settings?.learningGoal ?? prev.learningGoal,
          narratorPersona: settings?.narratorPersona ?? prev.narratorPersona,
          messages: slicedMessages,
          hasMoreMessages: (messages ?? []).length > MESSAGE_PAGE_SIZE,
        }));
      } catch (error) {
        console.warn("Failed to hydrate Supabase state", error);
      } finally {
        isHydrating.current = false;
      }
    },
    [supabase]
  );

  useEffect(() => {
    if (hasHydrated.current) return;
    hasHydrated.current = true;

    const init = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.warn("Failed to read Supabase session", error);
      }
      const sessionUser = data.session?.user;
      const user = sessionUser
        ? { id: sessionUser.id, email: sessionUser.email ?? null }
        : null;
      updateStoreWith((prev) => ({ ...prev, user }));
      if (user) {
        await hydrateUserData(user.id);
      }
    };

    void init();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        const sessionUser = session?.user;
        const user = sessionUser
          ? { id: sessionUser.id, email: sessionUser.email ?? null }
          : null;
        const previousUserId = storeState.user?.id;
        const nextUserId = user?.id;
        const shouldReset = previousUserId !== nextUserId;
        if (shouldReset && settingsPersistTimeout.current) {
          clearTimeout(settingsPersistTimeout.current);
          settingsPersistTimeout.current = null;
          pendingSettings.current = null;
        }
        updateStoreWith((prev) => ({
          ...prev,
          user,
          character: shouldReset ? defaultState.character : prev.character,
          llmSettings: shouldReset ? defaultState.llmSettings : prev.llmSettings,
          level: shouldReset ? defaultState.level : prev.level,
          uiLanguage: shouldReset ? defaultState.uiLanguage : prev.uiLanguage,
          theme: shouldReset ? defaultState.theme : prev.theme,
          textSize: shouldReset ? defaultState.textSize : prev.textSize,
          correctionStyle: shouldReset
            ? defaultState.correctionStyle
            : prev.correctionStyle,
          rpgTheme: shouldReset ? defaultState.rpgTheme : prev.rpgTheme,
          learningGoal: shouldReset
            ? defaultState.learningGoal
            : prev.learningGoal,
          narratorPersona: shouldReset
            ? defaultState.narratorPersona
            : prev.narratorPersona,
          messages: shouldReset ? [] : prev.messages,
          hasMoreMessages: shouldReset ? false : prev.hasMoreMessages,
        }));
        if (nextUserId && shouldReset) {
          void hydrateUserData(nextUserId);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, hydrateUserData]);

  useEffect(() => {
    const root = getBrowserRuntime();
    if (root.document?.documentElement?.dataset) {
      root.document.documentElement.dataset.theme = state.theme;
    }
  }, [state.theme]);

  const updateState = useCallback(
    (next: Partial<AppState>) => {
      updateStoreWith((prev) => ({ ...prev, ...next }));
      const shouldPersistSettings =
        "level" in next ||
        "uiLanguage" in next ||
        "theme" in next ||
        "textSize" in next ||
        "correctionStyle" in next ||
        "rpgTheme" in next ||
        "learningGoal" in next ||
        "narratorPersona" in next;
      if (shouldPersistSettings) {
        scheduleSettingsPersist(getUserSettingsSnapshot());
      }
    },
    [getUserSettingsSnapshot, scheduleSettingsPersist]
  );

  const updateLlmSettings = useCallback(
    (next: Partial<AppState["llmSettings"]>) => {
      const mergedSettings = {
        correctionStyle: storeState.correctionStyle,
        rpgTheme: storeState.rpgTheme,
        learningGoal: storeState.learningGoal,
        narratorPersona: storeState.narratorPersona,
        ...storeState.llmSettings,
        ...next,
      };
      updateStoreWith((prev) => ({
        ...prev,
        llmSettings: mergedSettings,
        correctionStyle: mergedSettings.correctionStyle ?? prev.correctionStyle,
        rpgTheme: mergedSettings.rpgTheme ?? prev.rpgTheme,
        learningGoal: mergedSettings.learningGoal ?? prev.learningGoal,
        narratorPersona: mergedSettings.narratorPersona ?? prev.narratorPersona,
      }));
      scheduleSettingsPersist(getUserSettingsSnapshot());
    },
    [getUserSettingsSnapshot, scheduleSettingsPersist]
  );

  const updateCharacter = useCallback(
    (next: Partial<AppState["character"]>) => {
      const updatedCharacter = { ...storeState.character, ...next };
      updateStoreWith((prev) => ({
        ...prev,
        character: updatedCharacter,
      }));
      const userId = storeState.user?.id;
      if (userId && !isHydrating.current) {
        void upsertCharacter(supabase, userId, updatedCharacter).catch(
          (error) => {
            console.warn("Failed to persist character", error);
          }
        );
      }
    },
    [supabase]
  );

  const addMessage = useCallback(
    (message: AppState["messages"][number], options?: { persist?: boolean }) => {
      const shouldPersist = options?.persist ?? true;
      updateStoreWith((prev) => ({
        ...prev,
        messages: [...prev.messages, message],
      }));
      const userId = storeState.user?.id;
      if (userId && !isHydrating.current && shouldPersist) {
        void insertMessage(supabase, userId, message)
          .then((messageId) => {
            if (!messageId) return;
            updateStoreWith((prev) => {
              const nextMessages = [...prev.messages];
              const existingIndex = message.tempId
                ? nextMessages.findIndex((item) => item.tempId === message.tempId)
                : nextMessages.findIndex(
                    (item) =>
                      !item.id &&
                      item.role === message.role &&
                      item.content === message.content
                  );
              if (existingIndex < 0) return prev;
              const existing = nextMessages[existingIndex];
              if (
                existing &&
                !existing.id &&
                existing.role === message.role &&
                existing.content === message.content
              ) {
                nextMessages[existingIndex] = { ...existing, id: messageId };
                return { ...prev, messages: nextMessages };
              }
              return prev;
            });
          })
          .catch((error) => {
            console.warn("Failed to persist message", error);
          });
      }
    },
    [supabase]
  );

  const persistPendingMessages = useCallback(async () => {
    const userId = storeState.user?.id;
    if (!userId || isHydrating.current) return;
    const pendingMessages = storeState.messages.filter((message) => !message.id);
    if (pendingMessages.length === 0) return;

    for (const message of pendingMessages) {
      if (!message || message.id) continue;
      try {
        const messageId = await insertMessage(supabase, userId, message);
        if (!messageId) continue;
        updateStoreWith((prev) => {
          const nextMessages = [...prev.messages];
          const currentIndex = message.tempId
            ? nextMessages.findIndex((item) => item.tempId === message.tempId)
            : nextMessages.findIndex(
                (item) =>
                  !item.id &&
                  item.role === message.role &&
                  item.content === message.content
              );
          if (currentIndex < 0) return prev;
          const current = nextMessages[currentIndex];
          if (
            current &&
            !current.id &&
            current.role === message.role &&
            current.content === message.content
          ) {
            nextMessages[currentIndex] = { ...current, id: messageId };
            return { ...prev, messages: nextMessages };
          }
          return prev;
        });
      } catch (error) {
        console.warn("Failed to persist pending message", error);
      }
    }
  }, [supabase]);

  const loadMoreMessages = useCallback(async () => {
    const userId = storeState.user?.id;
    if (!userId || isHydrating.current) return;
    const offset = storeState.messages.length;
    try {
      const olderMessages = await fetchMessages(supabase, userId, {
        limit: MESSAGE_PAGE_SIZE + 1,
        offset,
      });
      if (olderMessages.length === 0) {
        updateStoreWith((prev) => ({ ...prev, hasMoreMessages: false }));
        return;
      }
      const slicedMessages = olderMessages.slice(0, MESSAGE_PAGE_SIZE);
      updateStoreWith((prev) => ({
        ...prev,
        messages: [...slicedMessages, ...prev.messages],
        hasMoreMessages: olderMessages.length > MESSAGE_PAGE_SIZE,
      }));
    } catch (error) {
      console.warn("Failed to load more messages", error);
    }
  }, [supabase]);

  const removeMessageAt = useCallback((
    index: number,
    options?: { persist?: boolean }
  ) => {
    const shouldPersist = options?.persist ?? true;
    const messageToRemove = storeState.messages[index];
    const nextMessages = storeState.messages.filter(
      (_message, itemIndex) => itemIndex !== index
    );
    updateStoreWith((prev) => ({
      ...prev,
      messages: nextMessages,
    }));
    const userId = storeState.user?.id;
    if (userId && !isHydrating.current && shouldPersist) {
      if (messageToRemove?.id) {
        void deleteMessageById(supabase, userId, messageToRemove.id).catch(
          (error) => {
            console.warn("Failed to delete message", error);
          }
        );
        return;
      }
      if (nextMessages.length === 0) {
        void clearMessagesStore(supabase, userId).catch((error) => {
          console.warn("Failed to clear messages", error);
        });
        return;
      }
      void clearMessagesStore(supabase, userId)
        .then(() => insertMessages(supabase, userId, nextMessages))
        .catch((error) => {
          console.warn("Failed to sync messages", error);
        });
    }
  }, [supabase]);

  const clearMessages = useCallback(() => {
    updateStoreWith((prev) => ({
      ...prev,
      messages: [],
      hasMoreMessages: false,
    }));
    const userId = storeState.user?.id;
    if (userId && !isHydrating.current) {
      void clearMessagesStore(supabase, userId).catch((error) => {
        console.warn("Failed to clear messages", error);
      });
    }
  }, [supabase]);

  const resetConversation = useCallback(() => {
    const user = storeState.user;
    updateStore({
      ...defaultState,
      user,
      level: storeState.level,
      uiLanguage: storeState.uiLanguage,
      theme: storeState.theme,
      textSize: storeState.textSize,
      correctionStyle: storeState.correctionStyle,
      rpgTheme: storeState.rpgTheme,
      learningGoal: storeState.learningGoal,
      narratorPersona: storeState.narratorPersona,
      llmSettings: storeState.llmSettings,
    });
    if (user && !isHydrating.current) {
      void clearMessagesStore(supabase, user.id).catch((error) => {
        console.warn("Failed to clear messages", error);
      });
      void clearCharacter(supabase, user.id).catch((error) => {
        console.warn("Failed to clear character", error);
      });
    }
  }, [supabase]);

  const value = useMemo(
    () => ({
      state,
      updateState,
      updateCharacter,
      updateLlmSettings,
      addMessage,
      removeMessageAt,
      persistPendingMessages,
      loadMoreMessages,
      clearMessages,
      resetConversation,
    }),
    [
      state,
      updateState,
      updateCharacter,
      updateLlmSettings,
      addMessage,
      removeMessageAt,
      persistPendingMessages,
      loadMoreMessages,
      clearMessages,
      resetConversation,
    ]
  );

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
