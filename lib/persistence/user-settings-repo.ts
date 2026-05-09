import type { Pool } from "pg";
import { getDbPool } from "@/lib/db/client";
import { defaultSettings } from "@/lib/defaults";
import type { UserSettings } from "@/lib/types";

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

function pickAllowed<T extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback: T
): T {
  if (value && allowed.includes(value as T)) return value as T;
  return fallback;
}

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

export async function fetchUserSettings(userId: string, pool: Pool = getDbPool()) {
  const result = await pool.query<UserSettingsRow>(
    `select id, user_id, level, ui_language, theme, text_size, correction_style,
            rpg_theme, learning_goal, narrator_persona, created_at, updated_at
     from user_settings
     where user_id = $1
     order by updated_at desc
     limit 1`,
    [userId]
  );
  const row = result.rows[0];
  return row ? mapRowToUserSettings(row) : null;
}

export async function upsertUserSettings(
  userId: string,
  settings: UserSettings,
  pool: Pool = getDbPool()
) {
  await pool.query(
    `insert into user_settings (
       user_id, level, ui_language, theme, text_size, correction_style,
       rpg_theme, learning_goal, narrator_persona, updated_at
     ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
     on conflict (user_id) do update set
       level = excluded.level,
       ui_language = excluded.ui_language,
       theme = excluded.theme,
       text_size = excluded.text_size,
       correction_style = excluded.correction_style,
       rpg_theme = excluded.rpg_theme,
       learning_goal = excluded.learning_goal,
       narrator_persona = excluded.narrator_persona,
       updated_at = now()`,
    [
      userId,
      settings.level ?? null,
      settings.uiLanguage ?? null,
      settings.theme ?? null,
      settings.textSize ?? null,
      settings.correctionStyle ?? null,
      settings.rpgTheme ?? null,
      settings.learningGoal ?? null,
      settings.narratorPersona ?? null,
    ]
  );
}
