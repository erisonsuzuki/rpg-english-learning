# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router pages, layouts, and global styles.
- `components/`: UI components and client state provider.
- `lib/`: LLM prompt builder, providers, storage, and context utilities.
- `public/`: PWA assets (manifest, icons) and service worker.
- `docs/`: product docs and the core prompt (`docs/prompt.md`).

## Build, Test, and Development Commands
- `npm run dev`: start the local dev server with hot reload.
- `npm run build`: create a production build.
- `npm run start`: run the production build locally.
- `npm run lint`: run ESLint across the project.

## Coding Style & Naming Conventions
- Indentation: 2 spaces in JSON, 2 spaces in CSS, and 2 spaces in TS/TSX.
- Files and folders: kebab-case (e.g., `chat-panel.tsx`).
- Components: PascalCase exports (e.g., `ChatPanel`).
- Linting: ESLint with Next.js flat config (`eslint.config.mjs`).

## Testing Guidelines
There is no test framework configured yet. When tests are added:
- Prefer colocated tests in a `__tests__/` folder or `*.test.ts(x)` naming.
- Document the test command in this file.

## Commit & Pull Request Guidelines
- Commit style follows Conventional Commits. Example from history:
  - `feat: scaffold RPG English Learning PWA`
- Use clear, scoped messages: `feat: add chat api route`, `fix: handle empty message`.
- PRs should include:
  - A short description of changes.
  - Screenshots for UI changes.
  - Links to related issues or tasks when applicable.

## Security & Configuration Tips
- Do not commit secrets. Use `.env.local` for:
  - `GROQ_API_KEY`, `NVIDIA_API_KEY`
  - Optional: `GROQ_MODEL`, `NEMOTRON_MODEL`
- The LLM behavior must follow `docs/prompt.md`. Keep dynamic context in the system prompt builder (`lib/prompt.ts`).
