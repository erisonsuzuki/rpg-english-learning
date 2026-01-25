import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { CharacterBuilder } from "@/components/character-builder";

vi.mock("@/components/app-state", () => ({
  useAppState: () => ({
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
    updateCharacter: vi.fn(),
    updateLlmSettings: vi.fn(),
  }),
}));

describe("CharacterBuilder error rendering", () => {
  it("shows the error message under the last edited field", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: "Input includes a token-like secret." }),
        text: () => Promise.resolve("Input includes a token-like secret."),
      })
    );

    render(<CharacterBuilder />);

    fireEvent.click(screen.getByRole("button", { name: "Ask the LLM for help" }));

    const voiceInput = screen.getByLabelText(
      "How did your character learn to speak?"
    ) as HTMLInputElement;
    fireEvent.change(voiceInput, { target: { value: "sk-12345678901234567890" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Generate Profile" }));
    });

    const errorMessage = await screen.findByText(
      "Input includes a token-like secret."
    );
    expect(errorMessage).toBeTruthy();
    const fieldRow = (
      voiceInput as unknown as { parentElement?: { textContent?: string } }
    ).parentElement;
    expect(fieldRow?.textContent).toContain(
      "Input includes a token-like secret."
    );
  });
});
