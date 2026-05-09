import type { Pool, PoolClient } from "pg";
import { getDbPool } from "@/lib/db/client";
import type { ChatMessage, ChatRole } from "@/lib/types";

export type ChatMessageRow = {
  id: string;
  user_id: string;
  role: string;
  content: string;
  provider: string | null;
  model: string | null;
  position: string | number;
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
    Number(a.position) - Number(b.position) ||
    String(a.created_at).localeCompare(String(b.created_at)) ||
    a.id.localeCompare(b.id)
  );
}

async function lockUserMessages(userId: string, client: PoolClient) {
  await client.query("select pg_advisory_xact_lock(hashtext($1))", [userId]);
}

async function getNextMessagePosition(userId: string, client: PoolClient) {
  const result = await client.query<{ position: string }>(
    `select coalesce(max(position), 0) + 1 as position
     from chat_messages
     where user_id = $1`,
    [userId]
  );
  return result.rows[0]?.position ?? "1";
}

export async function fetchMessages(
  userId: string,
  options: { limit?: number; offset?: number } = {},
  pool: Pool = getDbPool()
) {
  const limit = options.limit ?? DEFAULT_MESSAGE_LIMIT;
  const offset = options.offset ?? 0;
  const result = await pool.query<ChatMessageRow>(
    `select id, user_id, role, content, provider, model, position, created_at
     from chat_messages
     where user_id = $1
     order by position desc, created_at desc, id desc
     limit $2 offset $3`,
    [userId, limit, offset]
  );
  return normalizeMessageOrder(result.rows).map(mapRowToMessage);
}

export async function insertMessage(
  userId: string,
  message: ChatMessage,
  pool: Pool = getDbPool()
) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await lockUserMessages(userId, client);
    const position = await getNextMessagePosition(userId, client);
    const result = await client.query<{ id: string }>(
      `insert into chat_messages (user_id, role, content, provider, model, position)
       values ($1, $2, $3, $4, $5, $6)
       returning id`,
      [
        userId,
        message.role,
        message.content,
        message.provider ?? null,
        message.model ?? null,
        position,
      ]
    );
    await client.query("commit");
    return result.rows[0]?.id ?? null;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function insertMessages(
  userId: string,
  messages: ChatMessage[],
  pool: Pool = getDbPool()
) {
  if (messages.length === 0) return [];
  const client = await pool.connect();
  const ids: string[] = [];
  try {
    await client.query("begin");
    await lockUserMessages(userId, client);
    const firstPosition = Number(await getNextMessagePosition(userId, client));
    for (const [index, message] of messages.entries()) {
      const result = await client.query<{ id: string }>(
        `insert into chat_messages (user_id, role, content, provider, model, position)
         values ($1, $2, $3, $4, $5, $6)
         returning id`,
        [
          userId,
          message.role,
          message.content,
          message.provider ?? null,
          message.model ?? null,
          firstPosition + index,
        ]
      );
      const id = result.rows[0]?.id;
      if (id) ids.push(id);
    }
    await client.query("commit");
    return ids;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function replaceMessages(
  userId: string,
  messages: ChatMessage[],
  pool: Pool = getDbPool()
) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await lockUserMessages(userId, client);
    await client.query("delete from chat_messages where user_id = $1", [userId]);
    const ids: string[] = [];
    for (const [index, message] of messages.entries()) {
      const result = await client.query<{ id: string }>(
        `insert into chat_messages (user_id, role, content, provider, model, position)
         values ($1, $2, $3, $4, $5, $6)
         returning id`,
        [
          userId,
          message.role,
          message.content,
          message.provider ?? null,
          message.model ?? null,
          index + 1,
        ]
      );
      const id = result.rows[0]?.id;
      if (id) ids.push(id);
    }
    await client.query("commit");
    return ids;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function clearMessages(userId: string, pool: Pool = getDbPool()) {
  await pool.query("delete from chat_messages where user_id = $1", [userId]);
}

export async function deleteMessageById(
  userId: string,
  messageId: string,
  pool: Pool = getDbPool()
) {
  await pool.query("delete from chat_messages where user_id = $1 and id = $2", [
    userId,
    messageId,
  ]);
}
