# RPG English Learning PWA

An installable RPG storytelling app that helps Portuguese-speaking users practice English with LLM-guided narrative, corrections, and vocabulary reinforcement.

## Features
- RPG chat with strict prompt rules from `docs/prompt.md`
- Character creation (name, class, backstory, stats) with optional LLM-assisted questionnaire
- Input guardrails for prompt injection and sensitive data, with inline error feedback
- English level selection (Beginner/Intermediate/Advanced)
- App UI language toggle (Portuguese/English)
- Dark mode toggle with persistent theme preference
- PostgreSQL-backed persistence
- Magic-link authentication via email
- Chat starters when history is empty
- Markdown rendering for chat responses
- PWA installable shell with service worker caching
- LLM providers: Groq (primary) and NVIDIA Nemotron (fallback)

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
NVIDIA_API_KEY=your_nvidia_key
GROQ_MODEL=openai/gpt-oss-20b
NEMOTRON_MODEL=nvidia/nemotron-3-nano-30b-a3b
NEXT_PUBLIC_SITE_URL=https://your-app-url.onrender.com
DATABASE_URL=postgresql://...
AUTH_SECRET=your_auth_secret
AUTH_URL=https://your-app-url.onrender.com
EMAIL_SERVER_HOST=smtp-relay.brevo.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=a0c38f001@smtp-brevo.com
EMAIL_SERVER_PASSWORD=your_brevo_smtp_key
EMAIL_FROM=verified-sender@yourdomain.com
```

Optional overrides:
- `GROQ_MODEL`
- `NEMOTRON_MODEL`

`make start` and `make start-docker` automatically start PostgreSQL and apply migrations from `db/migrations/`.

3) Run local development (Next.js on host, PostgreSQL in Docker):
```bash
make start
```

4) Run full Docker workflow (PostgreSQL + app container):
```bash
make start-docker
```

## Make Targets
- Local workflow:
  - `make start` - start PostgreSQL container, apply migrations, then run local dev server
  - `make stop` - stop local dev server
  - `make lint` - run ESLint on host
  - `make test` - run unit tests (Vitest) on host
- Docker/PostgreSQL helpers:
  - `make postgres-up` - start PostgreSQL container
  - `make postgres-down` - stop PostgreSQL container
  - `make postgres-logs` - stream PostgreSQL logs
  - `make postgres-migrate` - apply SQL migrations to PostgreSQL container
- Full Docker app workflow:
  - `make start-docker` - start PostgreSQL, migrate, build image, and run app container
  - `make stop-docker` - stop app container and PostgreSQL container
  - `make docker-build` - build app image (`rpg-english-learning:render`)
  - `make docker-run` - run app container on port `3000`
  - `make docker-stop` - stop app container
  - `make lint-docker` - run lint inside app image
  - `make test-docker` - run tests inside app image

## Project Structure
- `app/` - Next.js app router pages and layout
- `components/` - UI components and app state provider
- `lib/` - prompt builder, providers, persistence helpers, context tools
- `docs/` - product and prompt documentation
- `public/` - static assets (icons, PWA images)

## PWA Notes
- Manifest: `app/manifest.ts`
- Service worker: `app/sw.ts` (served at `/serwist/sw.js`)
- Serwist route: `app/serwist/[path]/route.ts`
- Icons: `public/icons/`

## LLM Notes
- Groq is the primary provider with Nemotron as fallback.
- The system prompt is built from `docs/prompt.md` plus runtime context.
- Long chats are summarized and trimmed, with an additional context-size cap to avoid token overflows.
- Provider/model metadata is logged on the server for debugging.
- Guardrails check chat + character inputs and block prompt injection or sensitive data requests.
- Errors are surfaced inline in the chat stream or under the character field that triggered them.

## License
TBD
