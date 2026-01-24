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
    landingTitle: "Aprenda inglês com narrativa RPG",
    landingIntro:
      "Explore histórias guiadas, receba correções e pratique vocabulário no contexto.",
    landingWhatYouDoTitle: "O que você pode fazer",
    landingWhatYouDoStory: "Jogar um RPG interativo com o Mestre da história.",
    landingWhatYouDoCorrections:
      "Receber correções e explicações no idioma do app.",
    landingWhatYouDoVocabulary:
      "Praticar novas palavras e gramática em contexto.",
    levelLabel: "Nível de Inglês",
    levelBeginner: "Iniciante",
    levelIntermediate: "Intermediário",
    levelAdvanced: "Avançado",
    themeLabel: "Tema",
    themeLight: "Claro",
    themeDark: "Escuro",
    textSizeLabel: "Tamanho do texto no chat",
    textSizeSmall: "Pequeno",
    textSizeMedium: "Médio",
    textSizeLarge: "Grande",
    languageLabel: "Idioma do App",
    languageOptionEnglish: "Inglês",
    languageOptionPortuguese: "Português",
    clearData: "Limpar Dados",
    clearChat: "Limpar Chat",
    actionLabel: "Sua Ação (Inglês)",
    chatEmpty: "As mensagens aparecem aqui quando o chat estiver ativo.",
    chatStartersTitle: "Comece com uma sugestão ou escreva abaixo:",
    chatStarterFantasy: "Quero começar uma aventura de fantasia.",
    chatStarterSciFi: "Podemos começar com uma história de ficção científica?",
    chatStarterVocabulary: "Quero aprender a palavra 'through' primeiro.",
    chatPlaceholderEmpty:
      "Comece sua aventura: escreva uma introdução ou escolha um termo para aprender.",
    chatPlaceholder: "Descreva o que seu personagem faz...",
    headerStory: "História",
    headerCharacter: "Personagem",
    headerSettings: "Configurações",
    chatSend: "Enviar",
    chatLoading: "Enviando...",
    chatLoadMore: "Carregar mensagens anteriores",
    chatLoadingMore: "Carregando...",
    chatError: "Não foi possível obter resposta.",
    chatErrorTitle: "Erro",
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
    authTitle: "Conta",
    authIntro: "Entre com seu email para salvar seu progresso.",
    authEmailLabel: "Email",
    authEmailPlaceholder: "voce@exemplo.com",
    authSendLink: "Enviar link mágico",
    authSending: "Enviando...",
    authCheckEmail: "Verifique sua caixa de entrada para continuar.",
    authSignedInAs: "Conectado como",
    authSignOut: "Sair",
    authUnknownUser: "Usuário",
    authRequired: "Faça login para salvar e continuar sua aventura.",
    installLabel: "Instalar App",
    updateAvailable: "Nova versão disponível.",
    updateAction: "Atualizar agora",
    updateRefreshing: "Atualizando...",
    subtitle: "Narrativa RPG para praticar inglês",
  },
  English: {
    settingsTitle: "Settings",
    characterTitle: "Character",
    chatTitle: "Story Chat",
    chatPurpose:
      "An interactive RPG that builds your English through story and coaching.",
    landingTitle: "Learn English through RPG storytelling",
    landingIntro:
      "Explore guided stories, receive corrections, and practice vocabulary in context.",
    landingWhatYouDoTitle: "What you can do",
    landingWhatYouDoStory: "Play an interactive RPG with the story master.",
    landingWhatYouDoCorrections:
      "Get corrections and explanations in your app language.",
    landingWhatYouDoVocabulary:
      "Practice new words and grammar in context.",
    levelLabel: "English Level",
    levelBeginner: "Beginner",
    levelIntermediate: "Intermediate",
    levelAdvanced: "Advanced",
    themeLabel: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    textSizeLabel: "Chat text size",
    textSizeSmall: "Small",
    textSizeMedium: "Medium",
    textSizeLarge: "Large",
    languageLabel: "App Language",
    languageOptionEnglish: "English",
    languageOptionPortuguese: "Portuguese",
    clearData: "Clear Data",
    clearChat: "Clear Chat",
    actionLabel: "Your Action (English)",
    chatEmpty: "Messages will appear here once the chat is active.",
    chatStartersTitle: "Start with a suggestion, or type below:",
    chatStarterFantasy: "I want to start a fantasy adventure.",
    chatStarterSciFi: "Can we start with a sci-fi story?",
    chatStarterVocabulary: "I want to learn the word 'through' first.",
    chatPlaceholderEmpty:
      "Start your adventure: write a story intro or pick a term to learn.",
    chatPlaceholder: "Describe what your character does...",
    headerStory: "Story",
    headerCharacter: "Character",
    headerSettings: "Settings",
    chatSend: "Send",
    chatLoading: "Sending...",
    chatLoadMore: "Load earlier messages",
    chatLoadingMore: "Loading...",
    chatError: "Could not fetch a response.",
    chatErrorTitle: "Error",
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
    authTitle: "Account",
    authIntro: "Sign in with your email to save your progress.",
    authEmailLabel: "Email",
    authEmailPlaceholder: "you@example.com",
    authSendLink: "Send magic link",
    authSending: "Sending...",
    authCheckEmail: "Check your inbox to continue.",
    authSignedInAs: "Signed in as",
    authSignOut: "Sign out",
    authUnknownUser: "User",
    authRequired: "Sign in to save and continue your adventure.",
    installLabel: "Install App",
    updateAvailable: "A new version is available.",
    updateAction: "Update now",
    updateRefreshing: "Updating...",
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
