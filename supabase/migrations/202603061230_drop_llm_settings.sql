insert into public.user_settings (
  user_id,
  correction_style,
  rpg_theme,
  learning_goal,
  narrator_persona,
  created_at,
  updated_at
)
select
  user_id,
  correction_style,
  rpg_theme,
  learning_goal,
  narrator_persona,
  created_at,
  updated_at
from public.llm_settings
on conflict (user_id)
do update set
  correction_style = excluded.correction_style,
  rpg_theme = excluded.rpg_theme,
  learning_goal = excluded.learning_goal,
  narrator_persona = excluded.narrator_persona,
  updated_at = greatest(public.user_settings.updated_at, excluded.updated_at)
where excluded.updated_at > public.user_settings.updated_at;

drop table if exists public.llm_settings;
