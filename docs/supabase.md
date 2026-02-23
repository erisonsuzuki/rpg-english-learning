## Schema
create table public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  class text,
  backstory text,
  stats text,
  weakness text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

## Migration (Add weakness)
alter table public.characters
add column if not exists weakness text;

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  content text not null,
  provider text,
  model text,
  created_at timestamptz not null default now()
);

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

create table public.app_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  level text,
  ui_language text,
  theme text,
  text_size text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index chat_messages_user_id_created_at_idx
on public.chat_messages (user_id, created_at);

create index characters_user_id_idx
on public.characters (user_id);

create index llm_settings_user_id_idx
on public.llm_settings (user_id);

create index app_settings_user_id_idx
on public.app_settings (user_id);

alter table public.characters enable row level security;
alter table public.chat_messages enable row level security;
alter table public.llm_settings enable row level security;
alter table public.app_settings enable row level security;

create policy "read own character"
on public.characters
for select
using (auth.uid() = user_id);

create policy "upsert own character"
on public.characters
for insert
with check (auth.uid() = user_id);

create policy "update own character"
on public.characters
for update
using (auth.uid() = user_id);

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

create policy "read own app settings"
on public.app_settings
for select
using (auth.uid() = user_id);

create policy "upsert own app settings"
on public.app_settings
for insert
with check (auth.uid() = user_id);

create policy "update own app settings"
on public.app_settings
for update
using (auth.uid() = user_id);

create policy "read own messages"
on public.chat_messages
for select
using (auth.uid() = user_id);

create policy "insert own messages"
on public.chat_messages
for insert
with check (auth.uid() = user_id);

create policy "delete own messages"
on public.chat_messages
for delete
using (auth.uid() = user_id);

## Declare Supabase Environment Variables

NEXT_PUBLIC_SUPABASE_URL=<SUBSTITUTE_SUPABASE_URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<SUBSTITUTE_SUPABASE_PUBLISHABLE_KEY>
