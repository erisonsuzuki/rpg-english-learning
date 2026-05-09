create extension if not exists pgcrypto;

create table if not exists characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text,
  class text,
  backstory text,
  stats text,
  weakness text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  role text not null check (role in ('system', 'user', 'assistant')),
  content text not null,
  provider text,
  model text,
  position bigint not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
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
  unique(user_id)
);

alter table chat_messages add column if not exists position bigint not null default 0;

with ordered_messages as (
  select
    id,
    row_number() over (
      partition by user_id
      order by nullif(position, 0) nulls last, created_at, id
    ) as position
  from chat_messages
)
update chat_messages
set position = ordered_messages.position
from ordered_messages
where chat_messages.id = ordered_messages.id;

create index if not exists chat_messages_user_position_idx on chat_messages(user_id, position desc, created_at desc, id desc);
create unique index if not exists chat_messages_user_position_unique_idx on chat_messages(user_id, position);
create index if not exists characters_user_idx on characters(user_id);
create index if not exists user_settings_user_idx on user_settings(user_id);
