-- Application identity is deliberately private; existing auth UUIDs remain stable.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.app_users (
  id uuid primary key,
  email text not null unique,
  created_at timestamptz not null default now()
);
insert into private.app_users (id, email, created_at)
select id, lower(email), created_at from auth.users where email is not null
on conflict (id) do update set email = excluded.email;

create table private.magic_link_tokens (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token_hash text not null unique,
  nonce_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create table private.magic_link_email_limits (
  email text primary key,
  next_allowed_at timestamptz not null
);
create table private.magic_link_ip_limits (
  ip_key text primary key,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count >= 0)
);
create table private.app_state_rate_limits (
  user_id uuid primary key references private.app_users(id) on delete cascade,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count >= 0)
);
create table private.app_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references private.app_users(id) on delete cascade,
  secret_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.characters drop constraint characters_user_id_fkey;
alter table public.chat_messages drop constraint chat_messages_user_id_fkey;
alter table public.user_settings drop constraint user_settings_user_id_fkey;
alter table public.characters add constraint characters_user_id_fkey foreign key (user_id) references private.app_users(id) on delete cascade;
alter table public.chat_messages add constraint chat_messages_user_id_fkey foreign key (user_id) references private.app_users(id) on delete cascade;
alter table public.user_settings add constraint user_settings_user_id_fkey foreign key (user_id) references private.app_users(id) on delete cascade;
alter table public.chat_messages drop constraint if exists chat_messages_role_check;
alter table public.chat_messages drop constraint if exists chat_messages_content_length_check;
alter table public.chat_messages drop constraint if exists chat_messages_provider_length_check;
alter table public.chat_messages drop constraint if exists chat_messages_model_length_check;
alter table public.chat_messages add constraint chat_messages_role_check check (role in ('user', 'assistant'));
alter table public.chat_messages add constraint chat_messages_content_length_check check (length(content) <= 10000);
alter table public.chat_messages add constraint chat_messages_provider_length_check check (provider is null or length(provider) <= 100);
alter table public.chat_messages add constraint chat_messages_model_length_check check (model is null or length(model) <= 100);
alter table public.characters drop constraint if exists characters_name_length_check;
alter table public.characters drop constraint if exists characters_class_length_check;
alter table public.characters drop constraint if exists characters_backstory_length_check;
alter table public.characters drop constraint if exists characters_stats_length_check;
alter table public.characters drop constraint if exists characters_weakness_length_check;
alter table public.characters add constraint characters_name_length_check check (name is null or length(name) <= 100);
alter table public.characters add constraint characters_class_length_check check (class is null or length(class) <= 100);
alter table public.characters add constraint characters_backstory_length_check check (backstory is null or length(backstory) <= 5000);
alter table public.characters add constraint characters_stats_length_check check (stats is null or length(stats) <= 5000);
alter table public.characters add constraint characters_weakness_length_check check (weakness is null or length(weakness) <= 5000);

drop policy if exists "read own character" on public.characters;
drop policy if exists "upsert own character" on public.characters;
drop policy if exists "update own character" on public.characters;
drop policy if exists "read own messages" on public.chat_messages;
drop policy if exists "insert own messages" on public.chat_messages;
drop policy if exists "delete own messages" on public.chat_messages;
drop policy if exists "read own user settings" on public.user_settings;
drop policy if exists "insert own user settings" on public.user_settings;
drop policy if exists "update own user settings" on public.user_settings;
drop policy if exists "delete own user settings" on public.user_settings;
revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to service_role;
grant select, insert, update, delete on public.characters, public.chat_messages, public.user_settings to service_role;
revoke create on schema public from anon, authenticated;

create or replace function public.app_create_magic_token(p_email text, p_token_hash text, p_nonce_hash text, p_expires_at timestamptz, p_cooldown_seconds integer, p_ip_key text, p_ip_limit integer, p_ip_window_seconds integer)
returns table(accepted boolean) language plpgsql security definer set search_path = private, pg_catalog, pg_temp as $$
declare v_ip private.magic_link_ip_limits;
begin
  if p_cooldown_seconds < 1 or p_ip_limit < 1 or p_ip_window_seconds < 1 then raise exception 'invalid limit'; end if;
  perform pg_advisory_xact_lock(hashtext('magic-email:' || p_email));
  perform pg_advisory_xact_lock(hashtext('magic-ip:' || p_ip_key));
  select * into v_ip from private.magic_link_ip_limits where ip_key = p_ip_key;
  if not found or v_ip.window_started_at <= now() - make_interval(secs => p_ip_window_seconds) then
    insert into private.magic_link_ip_limits (ip_key, window_started_at, request_count) values (p_ip_key, now(), 1) on conflict (ip_key) do update set window_started_at = excluded.window_started_at, request_count = excluded.request_count;
  elsif v_ip.request_count >= p_ip_limit then return query select false; return;
  else update private.magic_link_ip_limits set request_count = request_count + 1 where ip_key = p_ip_key; end if;
  insert into private.magic_link_email_limits (email, next_allowed_at) values (p_email, now() + make_interval(secs => p_cooldown_seconds)) on conflict (email) do update set next_allowed_at = excluded.next_allowed_at where private.magic_link_email_limits.next_allowed_at <= now();
  if not found then return query select false; return; end if;
  insert into private.magic_link_tokens (email, token_hash, nonce_hash, expires_at) values (p_email, p_token_hash, p_nonce_hash, p_expires_at);
  return query select true;
end $$;

create or replace function public.app_consume_magic_token(p_token_hash text, p_nonce_hash text, p_session_hash text, p_expires_at timestamptz)
returns table(user_id uuid) language plpgsql security definer set search_path = private, pg_catalog, pg_temp as $$
declare v_token private.magic_link_tokens; v_user uuid;
begin
  update private.magic_link_tokens set consumed_at = now() where token_hash = p_token_hash and nonce_hash = p_nonce_hash and consumed_at is null and expires_at > now() returning * into v_token;
  if not found then return; end if;
  select id into v_user from private.app_users where email = v_token.email;
  if v_user is null then v_user := gen_random_uuid(); insert into private.app_users (id, email) values (v_user, v_token.email); end if;
  insert into private.app_sessions (user_id, secret_hash, expires_at) values (v_user, p_session_hash, p_expires_at);
  return query select v_user;
end $$;

create or replace function public.app_session_user(p_secret_hash text)
returns table(id uuid, email text) language sql security definer set search_path = private, pg_catalog, pg_temp as $$
  select u.id, u.email from private.app_sessions s join private.app_users u on u.id = s.user_id where s.secret_hash = p_secret_hash and s.revoked_at is null and s.expires_at > now()
$$;
create or replace function public.app_revoke_session(p_secret_hash text)
returns void language sql security definer set search_path = private, pg_catalog, pg_temp as $$
  update private.app_sessions set revoked_at = now() where secret_hash = p_secret_hash and revoked_at is null
$$;

revoke all on function public.app_create_magic_token(text,text,text,timestamptz,integer,text,integer,integer), public.app_consume_magic_token(text,text,text,timestamptz), public.app_session_user(text), public.app_revoke_session(text) from public, anon, authenticated;
grant execute on function public.app_create_magic_token(text,text,text,timestamptz,integer,text,integer,integer), public.app_consume_magic_token(text,text,text,timestamptz), public.app_session_user(text), public.app_revoke_session(text) to service_role;

create or replace function public.app_state(p_user_id uuid, p_action text, p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = private, pg_catalog, pg_temp as $$
declare result jsonb;
begin
  if p_action = 'load' then
    if coalesce((p_payload->>'offset')::integer, -1) < 0 or coalesce((p_payload->>'offset')::integer, -1) > 10000 then raise exception 'invalid offset'; end if;
    return jsonb_build_object('character', (select to_jsonb(c) from public.characters c where c.user_id = p_user_id limit 1), 'messages', coalesce((select jsonb_agg(to_jsonb(m) order by m.created_at desc) from (select * from public.chat_messages where user_id = p_user_id order by created_at desc offset (p_payload->>'offset')::integer limit 50) m), '[]'::jsonb), 'hasMoreMessages', exists(select 1 from public.chat_messages where user_id = p_user_id offset ((p_payload->>'offset')::integer + 50) limit 1), 'settings', (select to_jsonb(s) from public.user_settings s where s.user_id = p_user_id limit 1));
  elsif p_action = 'save_settings' then
    insert into public.user_settings (user_id,level,ui_language,theme,text_size,correction_style,rpg_theme,learning_goal,narrator_persona) values (p_user_id,p_payload->>'level',p_payload->>'uiLanguage',p_payload->>'theme',p_payload->>'textSize',p_payload->>'correctionStyle',p_payload->>'rpgTheme',p_payload->>'learningGoal',p_payload->>'narratorPersona') on conflict (user_id) do update set level=excluded.level,ui_language=excluded.ui_language,theme=excluded.theme,text_size=excluded.text_size,correction_style=excluded.correction_style,rpg_theme=excluded.rpg_theme,learning_goal=excluded.learning_goal,narrator_persona=excluded.narrator_persona,updated_at=now();
  elsif p_action = 'save_character' then
    insert into public.characters (user_id,name,class,backstory,stats,weakness) values (p_user_id,p_payload->>'name',p_payload->>'class',p_payload->>'backstory',p_payload->>'stats',p_payload->>'weakness') on conflict (user_id) do update set name=excluded.name,class=excluded.class,backstory=excluded.backstory,stats=excluded.stats,weakness=excluded.weakness,updated_at=now();
  elsif p_action = 'add_message' then
    insert into public.chat_messages (user_id,role,content,provider,model) values (p_user_id,p_payload->>'role',p_payload->>'content',p_payload->>'provider',p_payload->>'model') returning to_jsonb(public.chat_messages.*) into result; return result;
  elsif p_action = 'delete_message' then
    delete from public.chat_messages where user_id=p_user_id and id=(p_payload->>'id')::uuid;
  elsif p_action = 'clear_messages' then
    delete from public.chat_messages where user_id=p_user_id;
  elsif p_action = 'clear_character' then
    delete from public.characters where user_id=p_user_id;
  else raise exception 'invalid action'; end if;
  return '{}'::jsonb;
end $$;
revoke all on function public.app_state(uuid,text,jsonb) from public, anon, authenticated;
grant execute on function public.app_state(uuid,text,jsonb) to service_role;

create or replace function public.app_consume_state_rate_limit(p_user_id uuid, p_limit integer, p_window_seconds integer)
returns boolean language plpgsql security definer set search_path = private, pg_catalog, pg_temp as $$
declare v_limit private.app_state_rate_limits;
begin
  if p_limit < 1 or p_window_seconds < 1 then raise exception 'invalid limit'; end if;
  perform pg_advisory_xact_lock(hashtext('state:' || p_user_id::text));
  select * into v_limit from private.app_state_rate_limits where user_id = p_user_id;
  if not found or v_limit.window_started_at <= now() - make_interval(secs => p_window_seconds) then
    insert into private.app_state_rate_limits (user_id, window_started_at, request_count) values (p_user_id, now(), 1) on conflict (user_id) do update set window_started_at = excluded.window_started_at, request_count = excluded.request_count;
    return true;
  end if;
  if v_limit.request_count >= p_limit then return false; end if;
  update private.app_state_rate_limits set request_count = request_count + 1 where user_id = p_user_id;
  return true;
end $$;
revoke all on function public.app_consume_state_rate_limit(uuid,integer,integer) from public, anon, authenticated;
grant execute on function public.app_consume_state_rate_limit(uuid,integer,integer) to service_role;

create or replace function public.app_health()
returns boolean language sql security definer set search_path = private, pg_catalog, pg_temp as $$
  select exists (select 1 from public.chat_messages limit 1)
$$;
revoke all on function public.app_health() from public, anon, authenticated;
grant execute on function public.app_health() to service_role;
