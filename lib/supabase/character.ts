import type { SupabaseClient } from "@supabase/supabase-js";
import type { CharacterProfile } from "@/lib/types";

export type CharacterRow = {
  id: string;
  user_id: string;
  name: string | null;
  class: string | null;
  backstory: string | null;
  stats: string | null;
  created_at: string;
  updated_at: string;
};

export function mapRowToCharacter(row: CharacterRow): CharacterProfile {
  return {
    name: row.name ?? "",
    class: row.class ?? "",
    backstory: row.backstory ?? "",
    stats: row.stats ?? "",
  };
}

export async function fetchCharacter(client: SupabaseClient, userId: string) {
  const { data, error } = await client
    .from("characters")
    .select("id,user_id,name,class,backstory,stats,created_at,updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapRowToCharacter(data as CharacterRow);
}

export async function upsertCharacter(
  client: SupabaseClient,
  userId: string,
  profile: CharacterProfile
) {
  const { error } = await client.from("characters").upsert(
    {
      user_id: userId,
      name: profile.name ?? null,
      class: profile.class ?? null,
      backstory: profile.backstory ?? null,
      stats: profile.stats ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) throw error;
}

export async function clearCharacter(client: SupabaseClient, userId: string) {
  const { error } = await client.from("characters").delete().eq("user_id", userId);
  if (error) throw error;
}
