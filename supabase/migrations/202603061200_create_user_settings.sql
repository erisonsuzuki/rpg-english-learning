create table public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  level text,
  ui_language text,
  theme text,
  text_size text,
  correction_style text,
  rpg_theme text,
  learning_goal text,
  narrator_persona text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.user_settings
  add constraint user_settings_level_check
  check (level is null or level in ('Beginner', 'Intermediate', 'Advanced')),
  add constraint user_settings_ui_language_check
  check (ui_language is null or ui_language in ('Portuguese', 'English')),
  add constraint user_settings_theme_check
  check (theme is null or theme in ('light', 'dark')),
  add constraint user_settings_text_size_check
  check (text_size is null or text_size in ('small', 'medium', 'large')),
  add constraint user_settings_correction_style_check
  check (
    correction_style is null
    or correction_style in ('Narrative Flow', 'Teacher Mode', 'Perfectionist')
  ),
  add constraint user_settings_learning_goal_check
  check (learning_goal is null or learning_goal in ('Basics', 'Conversation', 'Reading')),
  add constraint user_settings_narrator_persona_check
  check (narrator_persona is null or narrator_persona in ('Classic', 'Mystery', 'Humor')),
  add constraint user_settings_rpg_theme_length_check
  check (rpg_theme is null or length(rpg_theme) <= 200);

create index user_settings_user_id_idx
on public.user_settings (user_id);

alter table public.user_settings enable row level security;

create policy "read own user settings"
on public.user_settings
for select
using (auth.uid() = user_id);

create policy "insert own user settings"
on public.user_settings
for insert
with check (auth.uid() = user_id);

create policy "update own user settings"
on public.user_settings
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "delete own user settings"
on public.user_settings
for delete
using (auth.uid() = user_id);

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
  updated_at = greatest(public.user_settings.updated_at, excluded.updated_at);
