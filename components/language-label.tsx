"use client";

import { useAppState } from "@/components/app-state";

type LanguageLabelProps = {
  title: string;
  subtitle?: string;
};

const COPY = {
  Portuguese: {
    settingsTitle: "Configurações",
    characterTitle: "Personagem",
    chatTitle: "Chat da História",
    chatPurpose:
      "Um RPG interativo para praticar inglês com correções em português.",
    levelLabel: "Nível de Inglês",
    languageLabel: "Idioma do App",
    newConversation: "Nova Conversa",
    clearChat: "Limpar Chat",
    actionLabel: "Sua Ação (Inglês)",
    chatEmpty: "As mensagens aparecem aqui quando o chat estiver ativo.",
    chatStartersTitle: "Comece com uma sugestão:",
    chatStarterFantasy: "Quero começar uma aventura de fantasia.",
    chatStarterSciFi: "Podemos começar com uma história de ficção científica?",
    chatStarterVocabulary: "Quero aprender a palavra 'through' primeiro.",
    chatPlaceholder: "Descreva o que seu personagem faz...",
    chatSend: "Enviar",
    chatLoading: "Enviando...",
    chatError: "Não foi possível obter resposta.",
    characterBuilderTitle: "Questionário do Personagem",
    characterBuilderIntro:
      "Responda às perguntas para gerar um perfil inicial com ajuda da IA.",
    characterBuilderAction: "Gerar Perfil",
    characterBuilderLoading: "Gerando Perfil...",
    characterBuilderError: "Não foi possível gerar o perfil.",
    characterQuestionTheme: "Qual tema de RPG você prefere?",
    characterQuestionMotivation: "O que motiva seu personagem?",
    characterQuestionStrengths: "Duas qualidades?",
    characterQuestionFlaws: "Um defeito?",
    characterQuestionRole: "Papel preferido (tank/suporte/etc.)?",
    characterFieldName: "Nome",
    characterFieldClass: "Classe",
    characterFieldBackstory: "História",
    characterFieldStats: "Atributos",
    characterPlaceholderName: "Aria Ventoluna",
    characterPlaceholderClass: "Patrulheira",
    characterPlaceholderBackstory: "Uma viajante do norte enevoado...",
    characterPlaceholderStats: "Força: 8, Sabedoria: 12",
    characterHelpTitle: "Precisa de ajuda para criar?",
    characterHelpIntro:
      "Use o questionário abaixo para gerar um perfil inicial com o LLM.",
    characterHelpAction: "Quero ajuda do LLM",
    characterHelpHide: "Esconder questionário",
    onboardingTitle: "Bem-vindo à sua aventura",
    onboardingIntro:
      "Defina seu nível de inglês e idioma preferido antes de começar.",
    onboardingCta: "Começar",
    installLabel: "Instalar App",
    subtitle: "Narrativa RPG para praticar inglês",
  },
  English: {
    settingsTitle: "Settings",
    characterTitle: "Character",
    chatTitle: "Story Chat",
    chatPurpose:
      "An interactive RPG that builds your English through story and coaching.",
    levelLabel: "English Level",
    languageLabel: "App Language",
    newConversation: "New Conversation",
    clearChat: "Clear Chat",
    actionLabel: "Your Action (English)",
    chatEmpty: "Messages will appear here once the chat is active.",
    chatStartersTitle: "Start with a suggestion:",
    chatStarterFantasy: "I want to start a fantasy adventure.",
    chatStarterSciFi: "Can we start with a sci-fi story?",
    chatStarterVocabulary: "I want to learn the word 'through' first.",
    chatPlaceholder: "Describe what your character does...",
    chatSend: "Send",
    chatLoading: "Sending...",
    chatError: "Could not fetch a response.",
    characterBuilderTitle: "Character Questionnaire",
    characterBuilderIntro:
      "Answer the prompts to generate a starter profile with the LLM.",
    characterBuilderAction: "Generate Profile",
    characterBuilderLoading: "Generating Profile...",
    characterBuilderError: "Could not generate the profile.",
    characterQuestionTheme: "Preferred RPG theme?",
    characterQuestionMotivation: "What drives your character?",
    characterQuestionStrengths: "Two strengths?",
    characterQuestionFlaws: "One flaw?",
    characterQuestionRole: "Preferred role (tank/support/etc.)?",
    characterFieldName: "Name",
    characterFieldClass: "Class",
    characterFieldBackstory: "Backstory",
    characterFieldStats: "Stats",
    characterPlaceholderName: "Aria Moonwind",
    characterPlaceholderClass: "Ranger",
    characterPlaceholderBackstory: "A traveler from the misty north...",
    characterPlaceholderStats: "Strength: 8, Wisdom: 12",
    characterHelpTitle: "Need help creating your character?",
    characterHelpIntro:
      "Use the questionnaire below to generate a starter profile with the LLM.",
    characterHelpAction: "Ask the LLM for help",
    characterHelpHide: "Hide questionnaire",
    onboardingTitle: "Welcome to your adventure",
    onboardingIntro:
      "Set your English level and preferred language before you begin.",
    onboardingCta: "Start",
    installLabel: "Install App",
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
