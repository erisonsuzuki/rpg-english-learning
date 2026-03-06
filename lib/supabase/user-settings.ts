import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserSettings } from "@/lib/types";
import { defaultSettings } from "@/lib/defaults";

const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
const LANGUAGES = ["Portuguese", "English"] as const;
const THEMES = ["light", "dark"] as const;
const TEXT_SIZES = ["small", "medium", "large"] as const;
const CORRECTION_STYLES = [
  "Narrative Flow",
  "Teacher Mode",
  "Perfectionist",
] as const;
const LEARNING_GOALS = ["Basics", "Conversation", "Reading"] as const;
const NARRATOR_PERSONAS = ["Classic", "Mystery", "Humor"] as const;

function pickAllowed<T extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback: T
): T {
  if (value && allowed.includes(value as T)) {
    return value as T;
  }
  return fallback;
}

export type UserSettingsRow = {
  id: string;
  user_id: string;
  level: string | null;
  ui_language: string | null;
  theme: string | null;
  text_size: string | null;
  correction_style: string | null;
  rpg_theme: string | null;
  learning_goal: string | null;
  narrator_persona: string | null;
  created_at: string;
  updated_at: string;
};

export function mapRowToUserSettings(row: UserSettingsRow): UserSettings {
  return {
    level: pickAllowed(row.level, LEVELS, defaultSettings.level),
    uiLanguage: pickAllowed(
      row.ui_language,
      LANGUAGES,
      defaultSettings.uiLanguage
    ),
    theme: pickAllowed(row.theme, THEMES, defaultSettings.theme),
    textSize: pickAllowed(row.text_size, TEXT_SIZES, defaultSettings.textSize),
    correctionStyle: pickAllowed(
      row.correction_style,
      CORRECTION_STYLES,
      defaultSettings.correctionStyle
    ),
    rpgTheme: row.rpg_theme ?? defaultSettings.rpgTheme,
    learningGoal: pickAllowed(
      row.learning_goal,
      LEARNING_GOALS,
      defaultSettings.learningGoal
    ),
    narratorPersona: pickAllowed(
      row.narrator_persona,
      NARRATOR_PERSONAS,
      defaultSettings.narratorPersona
    ),
  };
}

export async function fetchUserSettings(
  client: SupabaseClient,
  userId: string
) {
  const { data, error } = await client
    .from("user_settings")
    .select(
      "id,user_id,level,ui_language,theme,text_size,correction_style,rpg_theme,learning_goal,narrator_persona,created_at,updated_at"
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapRowToUserSettings(data as UserSettingsRow);
}

export async function upsertUserSettings(
  client: SupabaseClient,
  userId: string,
  settings: UserSettings
) {
  const { error } = await client.from("user_settings").upsert(
    {
      user_id: userId,
      level: settings.level ?? null,
      ui_language: settings.uiLanguage ?? null,
      theme: settings.theme ?? null,
      text_size: settings.textSize ?? null,
      correction_style: settings.correctionStyle ?? null,
      rpg_theme: settings.rpgTheme ?? null,
      learning_goal: settings.learningGoal ?? null,
      narrator_persona: settings.narratorPersona ?? null,
    },
    { onConflict: "user_id" }
  );

  if (error) throw error;
}
