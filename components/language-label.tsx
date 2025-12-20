"use client";

import { useAppState } from "@/components/app-state";

type LanguageLabelProps = {
  title: string;
  subtitle?: string;
};

const COPY = {
  Portuguese: {
    settingsTitle: "Configuracoes",
    characterTitle: "Personagem",
    chatTitle: "Chat da Historia",
    levelLabel: "Nivel de Ingles",
    languageLabel: "Idioma do App",
    newConversation: "Nova Conversa",
    clearChat: "Limpar Chat",
    actionLabel: "Sua Acao (Ingles)",
    subtitle: "Narrativa RPG para praticar ingles",
  },
  English: {
    settingsTitle: "Settings",
    characterTitle: "Character",
    chatTitle: "Story Chat",
    levelLabel: "English Level",
    languageLabel: "App Language",
    newConversation: "New Conversation",
    clearChat: "Clear Chat",
    actionLabel: "Your Action (English)",
    subtitle: "Interactive RPG storytelling to practice English",
  },
};

export function useLabels() {
  const { state } = useAppState();
  return COPY[state.uiLanguage as "Portuguese" | "English"] || COPY.English;
}

export function LanguageLabel({ title, subtitle }: LanguageLabelProps) {
  return (
    <div>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
  );
}
