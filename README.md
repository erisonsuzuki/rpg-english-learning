# RPG English Learning PWA

An installable RPG storytelling app that helps Portuguese-speaking users practice English with LLM-guided narrative, corrections, and vocabulary reinforcement.

## Features
- RPG chat with strict prompt rules from `docs/prompt.md`
- Character creation (name, class, backstory, stats) with optional LLM-assisted questionnaire
- Input guardrails for prompt injection and sensitive data, with inline error feedback
- English level selection (Beginner/Intermediate/Advanced)
- App UI language toggle (Portuguese/English)
- Dark mode toggle with persistent theme preference
- Supabase-backed persistence of character and chat history
- Magic-link authentication via email
- Chat starters when history is empty
- Markdown rendering for chat responses
- PWA installable shell with service worker caching
- LLM provider: Groq

## Tech Stack
- Next.js (App Router)
- React
- TypeScript
- ESLint (flat config)
- Vitest + Testing Library (unit and UI tests)

## Getting Started
1) Install dependencies:
```bash
npm install
```

2) Add environment variables in `.env.local`:
```bash
GROQ_API_KEY=your_groq_key
GROQ_MODEL=openai/gpt-oss-20b
GROQ_MODEL_CHAT=openai/gpt-oss-20b
GROQ_MODEL_CHARACTER=openai/gpt-oss-120b
GROQ_MODEL_REVIEW=openai/gpt-oss-120b
GROQ_MODEL_SUMMARY=openai/gpt-oss-120b
GROQ_MODEL_FALLBACK=llama-3.3-70b-versatile
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
NEXT_PUBLIC_SITE_URL=https://your-app-url.io
```

Optional overrides:
- `GROQ_MODEL`
- `GROQ_MODEL_CHAT`
- `GROQ_MODEL_CHARACTER`
- `GROQ_MODEL_REVIEW`
- `GROQ_MODEL_SUMMARY`
- `GROQ_MODEL_FALLBACK`

3) Run the dev server:
```bash
make start
```

## Scripts
- `make start` - start local dev server
- `make stop` - stop the dev server
- `make lint` - run ESLint
- `make test` - run unit tests (Vitest)

## Project Structure
- `app/` - Next.js app router pages and layout
- `components/` - UI components and app state provider
- `lib/` - prompt builder, providers, Supabase data helpers, context tools
- `docs/` - product and prompt documentation
- `public/` - static assets (icons, PWA images)

## PWA Notes
- Manifest: `app/manifest.ts`
- Service worker: `app/sw.ts` (served at `/serwist/sw.js`)
- Serwist route: `app/serwist/[path]/route.ts`
- Icons: `public/icons/`

## LLM Notes
- Groq is the only provider.
- Chat model policy: `openai/gpt-oss-20b` with fallback `llama-3.3-70b-versatile`.
- Character/review/summary model policy: `openai/gpt-oss-120b` with fallback `llama-3.3-70b-versatile`.
- The system prompt is built from `docs/prompt.md` plus runtime context.
- Long chats are summarized and trimmed, with an additional context-size cap to avoid token overflows.
- Provider/model metadata is logged on the server for debugging.
- Guardrails check chat + character inputs and block prompt injection or sensitive data requests.
- Errors are surfaced inline in the chat stream or under the character field that triggered them.

## License

Designed by Erison Suzuki. Licensed under the [MIT License](license).
