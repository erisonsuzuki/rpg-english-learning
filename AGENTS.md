# AGENTS.md

## Fast Start (verified)
- Requires `node >=24` and `npm >=10` (`package.json` engines).
- Install/run: `npm install`, then `npm run dev` (or `make start`).
- Stop dev server with `make stop` (kills port 3000 and removes `.next/dev/lock`).
- Main checks: `npm run lint` and `npm run test`; no dedicated typecheck script, use `npm run build` for full Next validation.

## Focused test commands
- Single file: `npm run test -- components/__tests__/review-panel.test.tsx`.
- By name: `npx vitest -t "ReviewPanel"`.
- Vitest uses `jsdom`, loads `vitest.setup.ts`, and only includes `**/__tests__/**/*.{test.ts,test.tsx}`.

## High-value architecture map
- App is a single Next.js App Router project (not a monorepo): UI in `app/` + `components/`, core logic in `lib/`.
- Real page entry is `app/page.tsx` -> `components/home-content.tsx`; root wrappers are in `app/layout.tsx` (`SerwistClientProvider`, `AppProviders`, header, update banner).
- Global client state lives in `components/app-state.tsx` with shared types in `lib/types.ts`.
- LLM endpoints are `app/api/chat/route.ts`, `app/api/character/route.ts`, and `app/api/review/route.ts`; all require the custom application session, enforce rate limits, and call Groq directly with model fallback.

## Prompt/provider invariants
- Prompt source of truth is `docs/prompt.md`; builders are in `lib/prompts/`.
- If you change prompt shape or output format, update corresponding parser/UI expectations (not just the prompt text).
- Keep guardrails wired: `lib/guardrails.ts` is enforced before and/or after model output in API routes.

## Database/auth and env gotchas
- Required envs used at runtime: `GROQ_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- Supabase env access throws if missing (`utils/supabase/env.ts`); it is server-only and uses the service role key.
- Sessions are custom opaque HttpOnly cookies and are looked up/revoked on the server.

## PWA/service worker constraints
- Service worker source is `app/sw.ts`, served via `app/serwist/[path]/route.ts` at `/serwist/sw.js`.
- Update flow/cache cleanup logic is in `lib/sw-update.ts`; keep cache-prefix compatibility when changing SW cache names.

## Conventions worth preserving
- Use absolute imports via `@/` (configured in `tsconfig.json` and `vitest.config.ts`).
- Keep API errors structured with HTTP status codes (pattern used across `app/api/*/route.ts`).
- Follow existing commit style: Conventional Commits.
