import type { Pool } from "pg";
import { getDbPool } from "@/lib/db/client";
import type { CharacterProfile } from "@/lib/types";

export type CharacterRow = {
  id: string;
  user_id: string;
  name: string | null;
  class: string | null;
  backstory: string | null;
  stats: string | null;
  weakness: string | null;
  created_at: string;
  updated_at: string;
};

export function mapRowToCharacter(row: CharacterRow): CharacterProfile {
  return {
    name: row.name ?? "",
    class: row.class ?? "",
    backstory: row.backstory ?? "",
    stats: row.stats ?? "",
    weakness: row.weakness ?? "",
  };
}

export async function fetchCharacter(userId: string, pool: Pool = getDbPool()) {
  const result = await pool.query<CharacterRow>(
    `select id, user_id, name, class, backstory, stats, weakness, created_at, updated_at
     from characters
     where user_id = $1
     order by updated_at desc
     limit 1`,
    [userId]
  );
  const row = result.rows[0];
  return row ? mapRowToCharacter(row) : null;
}

export async function upsertCharacter(
  userId: string,
  profile: CharacterProfile,
  pool: Pool = getDbPool()
) {
  await pool.query(
    `insert into characters (user_id, name, class, backstory, stats, weakness, updated_at)
     values ($1, $2, $3, $4, $5, $6, now())
     on conflict (user_id) do update set
       name = excluded.name,
       class = excluded.class,
       backstory = excluded.backstory,
       stats = excluded.stats,
       weakness = excluded.weakness,
       updated_at = now()`,
    [
      userId,
      profile.name ?? null,
      profile.class ?? null,
      profile.backstory ?? null,
      profile.stats ?? null,
      profile.weakness ?? null,
    ]
  );
}

export async function clearCharacter(userId: string, pool: Pool = getDbPool()) {
  await pool.query("delete from characters where user_id = $1", [userId]);
}
