import type { SupabaseClient } from "@supabase/supabase-js";
import type { LlmSettings } from "@/lib/types";

export type LlmSettingsRow = {
  id: string;
  user_id: string;
  correction_style: string | null;
  rpg_theme: string | null;
  learning_goal: string | null;
  narrator_persona: string | null;
  created_at: string;
  updated_at: string;
};

export function mapRowToLlmSettings(row: LlmSettingsRow): LlmSettings {
  return {
    correctionStyle: row.correction_style ?? "",
    rpgTheme: row.rpg_theme ?? "",
    learningGoal: row.learning_goal ?? "",
    narratorPersona: row.narrator_persona ?? "",
  };
}

export async function fetchLlmSettings(client: SupabaseClient, userId: string) {
  const { data, error } = await client
    .from("llm_settings")
    .select(
      "id,user_id,correction_style,rpg_theme,learning_goal,narrator_persona,created_at,updated_at"
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapRowToLlmSettings(data as LlmSettingsRow);
}

export async function upsertLlmSettings(
  client: SupabaseClient,
  userId: string,
  settings: LlmSettings
) {
  const { error } = await client.from("llm_settings").upsert(
    {
      user_id: userId,
      correction_style: settings.correctionStyle ?? null,
      rpg_theme: settings.rpgTheme ?? null,
      learning_goal: settings.learningGoal ?? null,
      narrator_persona: settings.narratorPersona ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) throw error;
}
