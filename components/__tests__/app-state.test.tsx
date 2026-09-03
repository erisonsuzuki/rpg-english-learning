import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { AppStateProvider, useAppState } from "@/components/app-state";

vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ user: null }) }));

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

function MessageActions() {
  const { state, addMessage, persistPendingMessages, loadMoreMessages } = useAppState();
  return <div>
    <span data-testid="ids">{state.messages.map((message) => message.id ?? "pending").join(",")}</span>
    <button type="button" onClick={() => addMessage({ role: "user", content: "Pending", tempId: "temporary" }, { persist: false })}>Add pending</button>
    <button type="button" onClick={() => void persistPendingMessages()}>Persist pending</button>
    <button type="button" onClick={() => void loadMoreMessages()}>Load more</button>
  </div>;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("removeMessageAt", () => {
  it("removes the most recent message", () => {
    render(
      <AppStateProvider>
        <MessageCount />
      </AppStateProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByTestId("count")).toHaveTextContent("1");

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });
});

describe("message synchronization", () => {
  it("persists pending messages and reconciles their database IDs", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ user: { id: "user", email: "user@example.com" } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ messages: [], hasMoreMessages: false }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "saved-message" }) });
    vi.stubGlobal("fetch", fetchMock);
    render(<AppStateProvider><MessageActions /></AppStateProvider>);

    await act(async () => {});
    fireEvent.click(screen.getByRole("button", { name: "Add pending" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Persist pending" }));
    });

    expect(screen.getByTestId("ids")).toHaveTextContent("saved-message");
    expect(fetchMock).toHaveBeenLastCalledWith("/api/state", expect.objectContaining({ method: "POST", body: JSON.stringify({ action: "add_message", payload: { role: "user", content: "Pending" } }) }));
  });
});
