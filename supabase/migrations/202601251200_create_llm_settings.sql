create table public.llm_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  correction_style text,
  rpg_theme text,
  learning_goal text,
  narrator_persona text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index llm_settings_user_id_idx
on public.llm_settings (user_id);

alter table public.llm_settings enable row level security;

create policy "read own llm settings"
on public.llm_settings
for select
using (auth.uid() = user_id);

create policy "upsert own llm settings"
on public.llm_settings
for insert
with check (auth.uid() = user_id);

create policy "update own llm settings"
on public.llm_settings
for update
using (auth.uid() = user_id);
