# Repository Guidelines

This file is for agentic coding assistants working in this repo.
It summarizes structure, commands, and code style expectations.

## Project Structure & Module Organization
- `app/`: Next.js App Router pages, layouts, API routes, and global styles.
- `components/`: UI components and client state provider.
- `lib/`: core utilities, state types, providers, and helpers.
- `lib/prompts/`: prompt builders (system, character, review).
- `public/`: PWA assets (manifest, icons) and service worker.
- `docs/`: product docs and the core prompt (`docs/prompt.md`).

## Tooling and Commands
### Local Development
- `npm run dev`: run Next.js dev server (Turbopack).
- `npm run build`: production build.
- `npm run start`: serve the production build.
- `npm run stop`: stop the production server.
- `npm run lint`: run ESLint across the project.

### Testing (Vitest)
- `npm run test`: run all tests in CI mode.
- `npm run test:watch`: run tests in watch mode.

### Single-test Guidance
- Run a single file:
  - `npm run test -- components/__tests__/review-panel.test.tsx`
- Run a single test by name:
  - `npx vitest -t "ReviewPanel"`
- Prefer colocated tests in `__tests__/` or `*.test.ts(x)` files.

## Configuration and Environment
- Runtime expects `.env.local` for secrets.
- Required keys:
  - `GROQ_API_KEY`
  - `NVIDIA_API_KEY`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Optional model overrides:
  - `GROQ_MODEL`
  - `NEMOTRON_MODEL`

## Prompt and LLM Rules
- The core story system prompt lives in `docs/prompt.md`.
- Prompt builders live in `lib/prompts/`.
- Update `docs/prompt.md` before changing system prompt behavior.
- If prompt output format changes, update UI expectations in rendering components.
- Keep guardrails enforced in `lib/guardrails.ts` for inputs and outputs.

## Code Style and Conventions
### Formatting
- TypeScript/TSX: 2-space indentation.
- CSS: 2-space indentation.
- JSON: 2-space indentation.
- Prefer explicit line breaks when JSX props grow beyond 1 line.

### Naming
- Files/folders: kebab-case (e.g., `chat-panel.tsx`).
- Components: PascalCase (e.g., `ChatPanel`).
- Hooks: `useX` prefix.
- Constants: `UPPER_SNAKE_CASE` only for true constants.

### Imports
- Use absolute imports from `@/` for app code.
- Group imports: external libs → internal modules → types.
- Avoid unused imports; keep lint clean.

### Types
- Prefer explicit types for API payloads and provider responses.
- Use `type` aliases for payload shapes; interfaces are fine when extending.
- Keep shared types in `lib/types.ts`.

### Error Handling
- API routes should return structured errors with HTTP status codes.
- Provider errors should include response status/body when available.
- Use `try/catch` around LLM calls; return 5xx with readable error text.

### State Management
- App state is stored via `useSyncExternalStore` in `components/app-state.tsx`.
- Use provided helpers (`updateState`, `updateCharacter`, `addMessage`) to mutate state.
- Avoid mutating `state` directly in components.

### Styling
- Use CSS variables in `app/globals.css`.
- Theme switching uses `data-theme` on `<html>`.
- Keep new styles consistent with existing palette and spacing scale.
- Prefer class-based styling over inline styles.

## API and Providers
- Chat endpoint: `app/api/chat/route.ts`.
- Character endpoint: `app/api/character/route.ts`.
- Review endpoint: `app/api/review/route.ts`.
- Providers live in `lib/providers/` and must return `ProviderResult`.
- `runWithFallback` returns `{ result, provider }` and logs provider failures.

## Chat UX Expectations
- Chat messages support markdown rendering.
- Provider name appears in the role label (e.g., "Master (Groq)").
- When chat history is empty, show starter suggestions.

## Storage and Persistence
- Supabase persists chat messages and character profiles per authenticated user.
- Keep RLS policies strict to user ownership.
- Settings remain client-side and reset on refresh.

## Linting & Quality Checks
- ESLint is mandatory; keep `npm run lint` green.
- Avoid disabling lint rules unless strictly necessary.
- Keep console logs limited to server-side diagnostics (API routes).

## Commits & PRs
- Commit style: Conventional Commits (e.g., `feat: add chat api route`).
- PRs should include:
  - Short summary of changes.
  - Screenshots for UI updates.
  - Links to issues/tasks if available.

## Cursor/Copilot Rules
- No `.cursor/rules`, `.cursorrules`, or `.github/copilot-instructions.md` found.
- If added later, update this document accordingly.
