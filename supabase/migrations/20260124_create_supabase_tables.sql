create table public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  class text,
  backstory text,
  stats text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  content text not null,
  provider text,
  model text,
  created_at timestamptz not null default now()
);

create index chat_messages_user_id_created_at_idx
on public.chat_messages (user_id, created_at);

create index characters_user_id_idx
on public.characters (user_id);

alter table public.characters enable row level security;
alter table public.chat_messages enable row level security;

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
