import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { signIn } from "next-auth/react";
import { AuthForm } from "@/components/auth-form";

vi.mock("@/components/app-state", () => ({
  useAppState: () => ({
    state: { uiLanguage: "English" },
  }),
}));

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

const signInMock = vi.mocked(signIn);

describe("AuthForm", () => {
  it("submits a magic link and shows confirmation", async () => {
    const previousSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "https://rpg-english-learning.onrender.com";
    signInMock.mockResolvedValue({ error: undefined, ok: true, status: 200, url: null });

    render(<AuthForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send magic link" }));

    try {
      expect(signInMock).toHaveBeenCalledWith("email", {
        email: "test@example.com",
        redirect: false,
        callbackUrl: "https://rpg-english-learning.onrender.com",
      });
      expect(
        await screen.findByText("Check your inbox to continue. Also check your spam.")
      ).toBeTruthy();
    } finally {
      process.env.NEXT_PUBLIC_SITE_URL = previousSiteUrl;
    }
  });
});
