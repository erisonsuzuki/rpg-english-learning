import type { ChatMessage, CharacterProfile, UserSettings } from "@/lib/types";

type BootstrapResult = {
  character: CharacterProfile | null;
  messages: ChatMessage[];
  settings: UserSettings | null;
  hasMoreMessages: boolean;
};

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? `Request failed with ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function fetchBootstrap(limit: number) {
  return requestJson<BootstrapResult>(`/api/user-data/bootstrap?limit=${limit}`);
}

export async function fetchMessages(options: { limit: number; offset: number }) {
  return requestJson<{ messages: ChatMessage[] }>(
    `/api/user-data/messages?limit=${options.limit}&offset=${options.offset}`
  ).then((data) => data.messages);
}

export async function insertMessage(message: ChatMessage) {
  return requestJson<{ id: string | null }>("/api/user-data/messages", {
    method: "POST",
    body: JSON.stringify({ message }),
  }).then((data) => data.id);
}

export async function insertMessages(messages: ChatMessage[]) {
  return requestJson<{ ids: string[] }>("/api/user-data/messages/bulk", {
    method: "POST",
    body: JSON.stringify({ messages }),
  }).then((data) => data.ids);
}

export async function replaceMessages(messages: ChatMessage[]) {
  return requestJson<{ ids: string[] }>("/api/user-data/messages/replace", {
    method: "POST",
    body: JSON.stringify({ messages }),
  }).then((data) => data.ids);
}

export async function clearMessages() {
  await requestJson<{ ok: true }>("/api/user-data/messages", {
    method: "DELETE",
  });
}

export async function deleteMessageById(messageId: string) {
  await requestJson<{ ok: true }>(`/api/user-data/messages/${messageId}`, {
    method: "DELETE",
  });
}

export async function upsertCharacter(character: CharacterProfile) {
  await requestJson<{ ok: true }>("/api/user-data/character", {
    method: "PUT",
    body: JSON.stringify({ character }),
  });
}

export async function clearCharacter() {
  await requestJson<{ ok: true }>("/api/user-data/character", {
    method: "DELETE",
  });
}

export async function upsertUserSettings(settings: UserSettings) {
  await requestJson<{ ok: true }>("/api/user-data/settings", {
    method: "PUT",
    body: JSON.stringify({ settings }),
  });
}
