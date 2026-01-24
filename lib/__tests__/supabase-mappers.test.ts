import { describe, expect, it } from "vitest";
import { mapRowToMessage, normalizeMessageOrder } from "@/lib/supabase/messages";
import { mapRowToCharacter } from "@/lib/supabase/character";

describe("Supabase mappers", () => {
  it("maps chat message rows into chat messages", () => {
    const message = mapRowToMessage({
      id: "msg-1",
      user_id: "user-1",
      role: "assistant",
      content: "Hello",
      provider: "Groq",
      model: "mixtral",
      created_at: "2024-01-01T00:00:00Z",
    });

    expect(message).toEqual({
      id: "msg-1",
      role: "assistant",
      content: "Hello",
      provider: "Groq",
      model: "mixtral",
    });
  });

  it("normalizes message order to ascending", () => {
    const ordered = normalizeMessageOrder([
      {
        id: "msg-2",
        user_id: "user-1",
        role: "assistant",
        content: "Second",
        provider: null,
        model: null,
        created_at: "2024-01-02T00:00:00Z",
      },
      {
        id: "msg-1",
        user_id: "user-1",
        role: "user",
        content: "First",
        provider: null,
        model: null,
        created_at: "2024-01-01T00:00:00Z",
      },
    ]);

    expect(ordered.map((row) => row.id)).toEqual(["msg-1", "msg-2"]);
  });

  it("maps character rows into character profiles", () => {
    const profile = mapRowToCharacter({
      id: "char-1",
      user_id: "user-1",
      name: "Aria",
      class: "Ranger",
      backstory: "From the north",
      stats: "Dex 12",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-02T00:00:00Z",
    });

    expect(profile).toEqual({
      name: "Aria",
      class: "Ranger",
      backstory: "From the north",
      stats: "Dex 12",
    });
  });
});
