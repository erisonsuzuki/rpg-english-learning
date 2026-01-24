import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { CharacterBuilder } from "@/components/character-builder";

vi.mock("@/components/app-state", () => ({
  useAppState: () => ({
    state: {
      character: {},
      level: "Beginner",
      uiLanguage: "English",
      theme: "light",
      textSize: "medium",
      hasOnboarded: true,
      messages: [],
    },
    updateCharacter: vi.fn(),
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

    const themeInput = screen.getByLabelText("Preferred RPG theme?") as HTMLInputElement;
    fireEvent.change(themeInput, { target: { value: "sk-12345678901234567890" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Generate Profile" }));
    });

    const errorMessage = await screen.findByText(
      "Input includes a token-like secret."
    );
    expect(errorMessage).toBeTruthy();
    expect(themeInput.closest(".form-row")?.textContent).toContain(
      "Input includes a token-like secret."
    );
  });
});
