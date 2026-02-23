import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppSettings } from "@/lib/types";

export type AppSettingsRow = {
  id: string;
  user_id: string;
  level: string | null;
  ui_language: string | null;
  theme: string | null;
  text_size: string | null;
  created_at: string;
  updated_at: string;
};

export function mapRowToAppSettings(row: AppSettingsRow): AppSettings {
  const theme = row.theme === "light" || row.theme === "dark"
    ? row.theme
    : undefined;
  const textSize =
    row.text_size === "small" ||
    row.text_size === "medium" ||
    row.text_size === "large"
      ? row.text_size
      : undefined;
  return {
    level: row.level ?? undefined,
    uiLanguage: row.ui_language ?? undefined,
    theme,
    textSize,
  };
}

export async function fetchAppSettings(
  client: SupabaseClient,
  userId: string
) {
  const { data, error } = await client
    .from("app_settings")
    .select("id,user_id,level,ui_language,theme,text_size,created_at,updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapRowToAppSettings(data as AppSettingsRow);
}

export async function upsertAppSettings(
  client: SupabaseClient,
  userId: string,
  settings: AppSettings
) {
  const { error } = await client.from("app_settings").upsert(
    {
      user_id: userId,
      level: settings.level ?? null,
      ui_language: settings.uiLanguage ?? null,
      theme: settings.theme ?? null,
      text_size: settings.textSize ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) throw error;
}
