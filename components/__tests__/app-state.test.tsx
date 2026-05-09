import { describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { AppStateProvider, useAppState } from "@/components/app-state";

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" }),
}));

vi.mock("@/lib/persistence/client", () => ({
  clearCharacter: vi.fn(),
  clearMessages: vi.fn(),
  deleteMessageById: vi.fn(),
  fetchBootstrap: vi.fn(),
  fetchMessages: vi.fn(),
  insertMessage: vi.fn(),
  insertMessages: vi.fn(),
  upsertCharacter: vi.fn(),
  upsertUserSettings: vi.fn(),
}));

function MessageCount() {
  const { state, addMessage, removeMessageAt } = useAppState();
  return (
    <div>
      <span data-testid="count">{state.messages.length}</span>
      <button
        type="button"
        onClick={() => addMessage({ role: "user", content: "Hi" })}
      >
        Add
      </button>
      <button type="button" onClick={() => removeMessageAt(0)}>
        Remove
      </button>
    </div>
  );
}

describe("removeMessageAt", () => {
  it("removes the most recent message", () => {
    render(
      <AppStateProvider>
        <MessageCount />
      </AppStateProvider>
    );

    act(() => {
      screen.getByRole("button", { name: "Add" }).click();
    });
    expect(screen.getByTestId("count").textContent).toBe("1");

    act(() => {
      screen.getByRole("button", { name: "Remove" }).click();
    });
    expect(screen.getByTestId("count").textContent).toBe("0");
  });
});
