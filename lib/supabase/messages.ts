import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChatMessage, ChatRole } from "@/lib/types";

export type ChatMessageRow = {
  id: string;
  user_id: string;
  role: string;
  content: string;
  provider: string | null;
  model: string | null;
  created_at: string;
};

const DEFAULT_MESSAGE_LIMIT = 120;

export function mapRowToMessage(row: ChatMessageRow): ChatMessage {
  return {
    id: row.id,
    role: row.role as ChatRole,
    content: row.content,
    provider: row.provider ?? undefined,
    model: row.model ?? undefined,
  };
}

export function normalizeMessageOrder(rows: ChatMessageRow[]) {
  return [...rows].sort((a, b) =>
    a.created_at.localeCompare(b.created_at)
  );
}

export async function fetchMessages(
  client: SupabaseClient,
  userId: string,
  options: { limit?: number; offset?: number } = {}
) {
  const limit = options.limit ?? DEFAULT_MESSAGE_LIMIT;
  const offset = options.offset ?? 0;
  const rangeTo = Math.max(offset + limit - 1, offset);
  const { data, error } = await client
    .from("chat_messages")
    .select("id,user_id,role,content,provider,model,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, rangeTo);

  if (error) throw error;
  const ordered = normalizeMessageOrder(data ?? []);
  return ordered.map(mapRowToMessage);
}

export async function insertMessage(
  client: SupabaseClient,
  userId: string,
  message: ChatMessage
) {
  const { data, error } = await client
    .from("chat_messages")
    .insert({
      user_id: userId,
      role: message.role,
      content: message.content,
      provider: message.provider ?? null,
      model: message.model ?? null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data?.id ?? null;
}

export async function insertMessages(
  client: SupabaseClient,
  userId: string,
  messages: ChatMessage[]
) {
  if (messages.length === 0) return;
  const payload = messages.map((message) => ({
    user_id: userId,
    role: message.role,
    content: message.content,
    provider: message.provider ?? null,
    model: message.model ?? null,
  }));
  const { error } = await client.from("chat_messages").insert(payload);
  if (error) throw error;
}

export async function clearMessages(client: SupabaseClient, userId: string) {
  const { error } = await client.from("chat_messages").delete().eq("user_id", userId);
  if (error) throw error;
}

export async function deleteMessageById(
  client: SupabaseClient,
  userId: string,
  messageId: string
) {
  const { error } = await client
    .from("chat_messages")
    .delete()
    .eq("user_id", userId)
    .eq("id", messageId);
  if (error) throw error;
}
