# Option A Blueprint: Render Free Tier Hosting + PostgreSQL (No SQLite Migration)

## Decision Summary
- Choose **Render free tier for hosting**.
- Keep **PostgreSQL** (do not migrate to SQLite).
- Continue migration away from Supabase to Auth.js + DB-backed sessions and server-side persistence APIs.

## Why Option A
- Best fit for Auth.js session and verification token tables.
- Lower risk than changing hosting and database engine together.
- Better durability and scaling path than SQLite on free-tier sleeping/restarting containers.

## Assumptions
1. No historical Supabase data migration is needed.
2. App remains Next.js App Router with Docker deployment.
3. Auth target remains magic link (Brevo SMTP).

## Phase 1: Deployment and Environment Decoupling
**Objective**: Remove Supabase build-time coupling and align to Render + Postgres env model.

### File-level proposals
- `Dockerfile`
  - Remove Supabase build-arg checks.
  - Keep only generic/public URL checks if strictly needed.
- `README.md`
  - Replace Supabase env docs with:
    - `DATABASE_URL`
    - `AUTH_SECRET`
    - `AUTH_URL`
    - `EMAIL_SERVER_HOST`
    - `EMAIL_SERVER_PORT`
    - `EMAIL_SERVER_USER`
    - `EMAIL_SERVER_PASSWORD`
    - `EMAIL_FROM`
- `AGENTS.md`
  - Update architecture notes from Supabase to Postgres + Auth.js.

### Verification
- Docker build succeeds without Supabase envs.
- Render service boots with new env contract.

## Phase 2: Auth Migration to Auth.js + Magic Link
**Objective**: Replace Supabase auth flow with Auth.js email provider.

### File-level proposals
- Add `auth.ts`.
- Add `app/api/auth/[...nextauth]/route.ts`.
- Add `lib/auth/require-user.ts`.
- Update `components/auth-form.tsx` to Auth.js sign-in.
- Update `components/settings-panel.tsx` to Auth.js sign-out.
- Update `components/app-providers.tsx` to include session provider if needed.
- Update `components/app-state.tsx` session hydration/listening source.

### Verification
- Magic link request/callback works.
- Session exists after callback.
- Unauthorized protected route requests return 401.

## Phase 3: Persistence Boundary Migration to PostgreSQL Repositories
**Objective**: Stop browser-side Supabase persistence and move to server-owned APIs.

### File-level proposals
- Add:
  - `lib/persistence/messages-repo.ts`
  - `lib/persistence/character-repo.ts`
  - `lib/persistence/user-settings-repo.ts`
  - `lib/persistence/client.ts`
- Add routes:
  - `app/api/user-data/bootstrap/route.ts`
  - `app/api/user-data/messages/route.ts`
  - `app/api/user-data/messages/[id]/route.ts`
  - `app/api/user-data/messages/bulk/route.ts`
  - `app/api/user-data/character/route.ts`
  - `app/api/user-data/settings/route.ts`
- Update `components/app-state.tsx` to call internal APIs.

### Rules
- Enforce user scoping server-side (`WHERE user_id = session user`).
- Never trust client-provided `user_id`.
- Use parameterized SQL only.

### Verification
- Character/messages/settings CRUD parity with current UX.
- Pagination behavior preserved.

## Phase 4: Protected API Route Authorization Replacement
**Objective**: Remove Supabase server auth checks in existing endpoints.

### File-level proposals
- Update:
  - `app/api/chat/route.ts`
  - `app/api/character/route.ts`
  - `app/api/review/route.ts`
- Replace Supabase `getUser()` auth checks with `require-user()`.

### Verification
- Same route contracts and error formats.
- 401 behavior consistent when unauthenticated.

## Phase 5: Supabase Removal and Cleanup
**Objective**: Fully remove Supabase runtime artifacts and docs.

### Remove
- `utils/supabase/**`
- `lib/supabase/**`
- Supabase middleware/proxy logic if no longer used
- Supabase docs and env references

### Update
- `package.json` remove Supabase packages.
- `README.md`, `docs/*`, `AGENTS.md` references.

### Verification
- No Supabase imports in codebase.
- No Supabase envs required in deploy.

## Phase 6: Render Free-Tier Hardening
**Objective**: Improve reliability under cold starts and free-tier constraints.

### Tasks
- Add/verify health check endpoint usage.
- Confirm cookie settings with deployed domain (`AUTH_URL`).
- Add logs for auth/email/db failures.
- Validate session persistence across app restarts.

### Verification
- Cold start smoke test passes.
- Login + persistence still works after restart.

## Security Plan
- Session cookies: `HttpOnly`, `Secure`, `SameSite=Lax`.
- Short-lived magic-link tokens, one-time use.
- Strong `AUTH_SECRET`.
- SMTP key in Render env vars only.
- Rate-limit magic link requests to reduce abuse.

## Test Strategy

### Unit
- env validation
- `require-user` behavior
- repository mappers/defaults

### Integration
- auth endpoints: request magic link and callback
- protected endpoints unauthorized/authorized behavior
- user-data API CRUD and pagination

### Component
- `components/__tests__/auth-form.test.tsx` rewrite for Auth.js flow
- `components/__tests__/app-state.test.tsx` rewrite for API-backed persistence

### Manual smoke (staging and production)
1. Request magic link.
2. Complete login.
3. Create/update character.
4. Send/reload chat messages.
5. Run review flow.
6. Sign out and verify route protection.

## Rollout Plan
1. Deploy Phase 1 + 2 to staging.
2. Validate auth flow.
3. Deploy Phase 3 + 4.
4. Validate full persistence and API behavior.
5. Deploy cleanup and remove Supabase remnants.
6. Enable production monitoring for auth/session/email/db errors.

## Rollback Plan
- Keep previous stable commit available.
- If rollout fails, redeploy previous commit and previous env contract.
- Re-verify login/chat/review baseline.

## Execution Checklist
- [ ] Remove Supabase build-time Docker coupling
- [ ] Add Auth.js + Postgres env contract docs
- [ ] Implement Auth.js magic-link auth
- [ ] Implement Postgres repository + user-data APIs
- [ ] Refactor app-state to API persistence
- [ ] Replace protected route auth guards
- [ ] Remove Supabase runtime modules and docs
- [ ] Run test matrix and smoke tests
- [ ] Deploy on Render free tier and monitor
