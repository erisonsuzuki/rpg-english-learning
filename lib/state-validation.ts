const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const hasOnly = (value: Record<string, unknown>, keys: string[]) => Object.keys(value).every((key) => keys.includes(key));
const text = (value: unknown, maximum: number) => typeof value === "string" && value.length <= maximum;
const enumValue = (value: unknown, values: string[]) => typeof value === "string" && values.includes(value);

export function validateStateRequest(action: unknown, payload: unknown): Record<string, unknown> | null {
  if (typeof action !== "string" || !isObject(payload)) return null;
  if (action === "load") return hasOnly(payload, ["offset"]) && Number.isInteger(payload.offset) && (payload.offset as number) >= 0 && (payload.offset as number) <= 10_000 ? payload : null;
  if (["clear_messages", "clear_character"].includes(action)) return Object.keys(payload).length === 0 ? payload : null;
  if (action === "delete_message") return hasOnly(payload, ["id"]) && typeof payload.id === "string" && UUID.test(payload.id) ? payload : null;
  if (action === "add_message") return hasOnly(payload, ["role", "content", "provider", "model"]) && enumValue(payload.role, ["user", "assistant"]) && text(payload.content, 10_000) && (payload.provider === undefined || text(payload.provider, 100)) && (payload.model === undefined || text(payload.model, 100)) ? payload : null;
  if (action === "save_character") return hasOnly(payload, ["name", "class", "backstory", "stats", "weakness"]) && text(payload.name, 100) && text(payload.class, 100) && text(payload.backstory, 5_000) && text(payload.stats, 5_000) && text(payload.weakness, 5_000) ? payload : null;
  if (action === "save_settings") return hasOnly(payload, ["level", "uiLanguage", "theme", "textSize", "correctionStyle", "rpgTheme", "learningGoal", "narratorPersona"]) && enumValue(payload.level, ["Beginner", "Intermediate", "Advanced"]) && enumValue(payload.uiLanguage, ["Portuguese", "English"]) && enumValue(payload.theme, ["light", "dark"]) && enumValue(payload.textSize, ["small", "medium", "large"]) && enumValue(payload.correctionStyle, ["Narrative Flow", "Teacher Mode", "Perfectionist"]) && text(payload.rpgTheme, 200) && enumValue(payload.learningGoal, ["Basics", "Conversation", "Reading"]) && enumValue(payload.narratorPersona, ["Classic", "Mystery", "Humor"]) ? payload : null;
  return null;
}
