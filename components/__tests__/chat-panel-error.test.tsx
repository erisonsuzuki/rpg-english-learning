import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ChatPanel } from "@/components/chat-panel";
import { useAppState } from "@/components/app-state";

const addMessageMock = vi.fn();
const removeMessageAtMock = vi.fn();
const clearMessagesMock = vi.fn();
const persistPendingMessagesMock = vi.fn().mockResolvedValue(undefined);
const loadMoreMessagesMock = vi.fn().mockResolvedValue(undefined);
const updateStateMock = vi.fn();
const updateCharacterMock = vi.fn();
const resetConversationMock = vi.fn();

vi.mock("@/components/app-state", () => ({
  useAppState: vi.fn(),
}));

const useAppStateMock = vi.mocked(useAppState);

useAppStateMock.mockReturnValue({
    state: {
      messages: [],
      character: {},
      level: "Beginner",
      uiLanguage: "English",
      theme: "light",
      textSize: "medium",
      hasOnboarded: true,
      user: { id: "user-1", email: "test@example.com" },
      hasMoreMessages: false,
    },
    addMessage: addMessageMock,
    removeMessageAt: removeMessageAtMock,
    clearMessages: clearMessagesMock,
    persistPendingMessages: persistPendingMessagesMock,
    loadMoreMessages: loadMoreMessagesMock,
    updateState: updateStateMock,
    updateCharacter: updateCharacterMock,
    resetConversation: resetConversationMock,
  });

describe("ChatPanel error rendering", () => {
  it("shows error bubble and removes last message on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        text: () => Promise.resolve("Input includes a token-like secret."),
      })
    );

    render(<ChatPanel />);

    fireEvent.change(screen.getByLabelText("Your Action (English)"), {
      target: { value: "sk-12345678901234567890" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Send" }));
    });

    expect(removeMessageAtMock).toHaveBeenCalled();
    expect(screen.getAllByText("Error").length).toBeGreaterThan(0);
    expect(
      await screen.findByText("Input includes a token-like secret.")
    ).toBeTruthy();
  });
});

describe("ChatPanel load more", () => {
  it("loads more only after user scrolls to top", () => {
    loadMoreMessagesMock.mockClear();
    persistPendingMessagesMock.mockClear();

    useAppStateMock.mockReturnValue({
      state: {
        messages: Array.from({ length: 60 }, (_, index) => ({
          role: "user",
          content: `Message ${index}`,
        })),
        character: {},
        level: "Beginner",
        uiLanguage: "English",
        theme: "light",
        textSize: "medium",
        hasOnboarded: true,
        user: { id: "user-1", email: "test@example.com" },
        hasMoreMessages: true,
      },
      addMessage: addMessageMock,
      removeMessageAt: removeMessageAtMock,
      clearMessages: clearMessagesMock,
      persistPendingMessages: persistPendingMessagesMock,
      loadMoreMessages: loadMoreMessagesMock,
      updateState: updateStateMock,
      updateCharacter: updateCharacterMock,
      resetConversation: resetConversationMock,
    });

    const { container } = render(<ChatPanel />);

    const chatWindow = container.querySelector(".chat-window") as HTMLDivElement;
    expect(chatWindow).toBeTruthy();
    expect(loadMoreMessagesMock).not.toHaveBeenCalled();
    chatWindow.scrollTop = 10;
    fireEvent.scroll(chatWindow);

    expect(loadMoreMessagesMock).toHaveBeenCalled();
  });
});
