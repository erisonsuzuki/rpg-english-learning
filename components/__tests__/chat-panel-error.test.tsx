import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ChatPanel } from "@/components/chat-panel";

const addMessageMock = vi.fn();
const removeMessageAtMock = vi.fn();
const clearMessagesMock = vi.fn();

vi.mock("@/components/app-state", () => ({
  useAppState: () => ({
    state: {
      messages: [],
      character: {},
      level: "Beginner",
      uiLanguage: "English",
      theme: "light",
      textSize: "medium",
      hasOnboarded: true,
    },
    addMessage: addMessageMock,
    removeMessageAt: removeMessageAtMock,
    clearMessages: clearMessagesMock,
  }),
}));

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
