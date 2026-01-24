# Implementation Blueprint: Supabase Integration

## Overview
Replace local-only persistence with Supabase-backed storage and magic-link auth. Store chat messages and character profile per authenticated user, while keeping the existing RPG chat flow and prompt rules intact.

## Implementation Phases

### Phase 1: Supabase Project Setup + Schema
**Objective**: Define database tables, policies, and required env vars.
**Plan**:
- Create `chat_messages` and `characters` tables with `user_id`, timestamps, and content fields.
- Enable RLS and add policies to allow users to read/write only their own data.
- Add Supabase env vars to `.env.local`.
**SQL Proposal**:
```sql
create table public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  class text,
  backstory text,
  stats text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
```
**Tests**:
- Manual: insert/read rows as an authenticated user; verify anon access is blocked.

### Phase 2: Supabase Client/Server Utilities + Middleware
**Objective**: Add best-practice Supabase helpers for Next.js App Router.
**Plan**:
- Install `@supabase/supabase-js` and `@supabase/ssr`.
- Add `utils/supabase/client.ts`, `utils/supabase/server.ts`, and `utils/supabase/middleware.ts`.
- Add `middleware.ts` to refresh session cookies.
**Notes**:
- Use server client in API routes for secure data access.
- Use client client for auth and real-time session updates in UI.

### Phase 3: Magic-Link Auth Flow
**Objective**: Authenticate users by email and store session for subsequent requests.
**Plan**:
- Add auth UI (email input, send link, status/error states, sign-out).
- Load current session on boot and expose user profile to app state.
- Use email identity to tie chat and character data to `auth.users.id`.

### Phase 4: Data Access Layer
**Objective**: Read/write character and chat messages in Supabase.
**Plan**:
- Add `lib/supabase/character.ts` and `lib/supabase/messages.ts` helpers.
- Map Supabase records to `CharacterProfile` and `ChatMessage`.
- Add batching or pagination for chat message hydration (e.g., latest 120).

### Phase 5: App State + UI Updates
**Objective**: Replace localStorage persistence with Supabase-backed hydration.
**Plan**:
- Update `components/app-state.tsx` to load from Supabase after auth.
- Remove `lib/storage.ts` from the main flow and update settings storage size UI.
- Update Settings to show auth status and include sign-in/out actions.
- Keep existing chat/character flows, but persist to Supabase on change.

### Phase 6: Documentation Updates
**Objective**: Update docs to reflect Supabase storage and auth.
**Plan**:
- Update `docs/prd-core.md` with new data model and auth requirements.
- Add Supabase setup steps in `docs/rpg-english-pwa/blueprint-supabase.md`.

### Phase 7: Tests and Verification
**Objective**: Update or add tests to cover the new data flow.
**Plan**:
- Add unit tests for data helpers (message/character mapping and RLS errors).
- Add component tests for auth state UI and Supabase hydration.
- Update any existing tests affected by removal of local storage.

## Test Strategy
- Manual verification:
  - Sign in via magic link and confirm session persists on refresh.
  - Character updates persist across reloads.
  - Chat history persists and is scoped per user.
  - Sign out clears UI state and blocks Supabase reads.
- Lint: `npm run lint`.

## Consolidated Checklist
- [ ] Define Supabase schema and RLS policies for chat + character.
- [ ] Add Supabase deps and Next.js client/server/middleware utilities.
- [ ] Implement magic-link auth UI and session handling.
- [ ] Create Supabase data helpers for character and chat messages.
- [ ] Replace local storage persistence with Supabase hydration/persistence.
- [ ] Update docs (`docs/prd-core.md`, `docs/rpg-english-pwa/blueprint-supabase.md`).
- [ ] Update/add tests for Supabase data layer and auth UI.
- [ ] Manual verification for auth, chat, and character persistence.
