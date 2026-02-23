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

create index app_settings_user_id_idx
on public.app_settings (user_id);

alter table public.app_settings enable row level security;

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
with check (auth.uid() = user_id);
