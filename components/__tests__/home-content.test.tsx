import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomeContent } from "@/components/home-content";
import { useAppState } from "@/components/app-state";

vi.mock("@/components/app-state", () => ({
  useAppState: vi.fn(),
}));

vi.mock("@/components/chat-panel", () => ({
  ChatPanel: () => <div>Chat Panel Stub</div>,
}));

vi.mock("@/components/auth-form", () => ({
  AuthForm: () => <div>Auth Form Stub</div>,
}));

const useAppStateMock = vi.mocked(useAppState);

describe("HomeContent", () => {
  it("renders the landing view when signed out", () => {
    useAppStateMock.mockReturnValue({
      state: {
        character: {},
        level: "Beginner",
        uiLanguage: "English",
        correctionStyle: "Teacher Mode",
        rpgTheme: "",
        learningGoal: "Conversation",
        narratorPersona: "Classic",
        theme: "light",
        textSize: "medium",
        messages: [],
        hasMoreMessages: false,
        user: null,
      },
      updateState: vi.fn(),
      updateLlmSettings: vi.fn(),
      updateCharacter: vi.fn(),
      addMessage: vi.fn(),
      removeMessageAt: vi.fn(),
      persistPendingMessages: vi.fn(),
      loadMoreMessages: vi.fn(),
      clearMessages: vi.fn(),
      resetConversation: vi.fn(),
    });

    render(<HomeContent />);

    expect(
      screen.getByText("Learn English through RPG storytelling")
    ).toBeTruthy();
    expect(screen.getByText("Auth Form Stub")).toBeTruthy();
  });

  it("renders the chat when signed in", () => {
    useAppStateMock.mockReturnValue({
      state: {
        character: {},
        level: "Beginner",
        uiLanguage: "English",
        correctionStyle: "Teacher Mode",
        rpgTheme: "",
        learningGoal: "Conversation",
        narratorPersona: "Classic",
        theme: "light",
        textSize: "medium",
        messages: [],
        hasMoreMessages: false,
        user: { id: "user-1", email: "test@example.com" },
      },
      updateState: vi.fn(),
      updateLlmSettings: vi.fn(),
      updateCharacter: vi.fn(),
      addMessage: vi.fn(),
      removeMessageAt: vi.fn(),
      persistPendingMessages: vi.fn(),
      loadMoreMessages: vi.fn(),
      clearMessages: vi.fn(),
      resetConversation: vi.fn(),
    });

    render(<HomeContent />);

    expect(screen.getByText("Chat Panel Stub")).toBeTruthy();
  });
});
