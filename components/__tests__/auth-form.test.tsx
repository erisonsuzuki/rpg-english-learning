import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AuthForm } from "@/components/auth-form";
import { useAppState } from "@/components/app-state";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";

vi.mock("@/components/app-state", () => ({
  useAppState: vi.fn(),
}));

vi.mock("@/utils/supabase/client", () => ({
  getSupabaseBrowserClient: vi.fn(),
}));

const useAppStateMock = vi.mocked(useAppState);
const getSupabaseBrowserClientMock = vi.mocked(getSupabaseBrowserClient);

describe("AuthForm", () => {
  it("submits a magic link and shows confirmation", async () => {
    const previousSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "https://rpg-english-learning.onrender.com";
    const signInWithOtpMock = vi.fn().mockResolvedValue({ error: null });
    getSupabaseBrowserClientMock.mockReturnValue({
      auth: { signInWithOtp: signInWithOtpMock },
    } as unknown as ReturnType<typeof getSupabaseBrowserClient>);

    useAppStateMock.mockReturnValue({
      state: {
        character: {},
        level: "Beginner",
        uiLanguage: "English",
        theme: "light",
        textSize: "medium",
        messages: [],
        hasMoreMessages: false,
        user: null,
      },
      updateState: vi.fn(),
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
      expect(signInWithOtpMock).toHaveBeenCalledWith({
        email: "test@example.com",
        options: {
          emailRedirectTo: "https://rpg-english-learning.onrender.com",
        },
      });
      expect(
        await screen.findByText("Check your inbox to continue.")
      ).toBeTruthy();
    } finally {
      process.env.NEXT_PUBLIC_SITE_URL = previousSiteUrl;
    }
  });
});
