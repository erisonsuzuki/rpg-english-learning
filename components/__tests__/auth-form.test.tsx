import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AuthForm } from "@/components/auth-form";
import { useAppState } from "@/components/app-state";

vi.mock("@/components/app-state", () => ({
  useAppState: vi.fn(),
}));

const useAppStateMock = vi.mocked(useAppState);

describe("AuthForm", () => {
  it("submits a magic link and shows confirmation", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

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

    render(<AuthForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send magic link" }));

    try {
      expect(fetchMock).toHaveBeenCalledWith("/api/auth/request", expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "test@example.com" }),
      }));
      expect(
        await screen.findByText("Check your inbox to continue. Also check your spam.")
      ).toBeTruthy();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
