# RPG English Learning PWA

An installable RPG storytelling app that helps Portuguese-speaking users practice English with LLM-guided narrative, corrections, and vocabulary reinforcement.

## Features
- RPG chat with strict prompt rules from `docs/prompt.md`
- Character creation (name, class, backstory, stats) with optional LLM-assisted questionnaire
- English level selection (Beginner/Intermediate/Advanced)
- App UI language toggle (Portuguese/English)
- Dark mode toggle with persistent theme preference
- Local-only persistence of settings and chat history (storage usage indicator + capped history)
- Chat starters when history is empty
- Markdown rendering for chat responses
- PWA installable shell with service worker caching
- LLM providers: Groq (primary) and NVIDIA Nemotron (fallback)

## Tech Stack
- Next.js (App Router)
- React
- TypeScript
- ESLint (flat config)

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
```

Optional overrides:
- `GROQ_MODEL`
- `NEMOTRON_MODEL`

3) Run the dev server:
```bash
npm run dev
```

## Scripts
- `npm run dev` - start local dev server
- `npm run build` - build for production
- `npm run start` - run production build
- `npm run lint` - run ESLint

## Project Structure
- `app/` - Next.js app router pages and layout
- `components/` - UI components and app state provider
- `lib/` - prompt builder, providers, storage, context tools
- `docs/` - product and prompt documentation
- `public/` - PWA assets and service worker

## PWA Notes
- Manifest: `public/manifest.json`
- Service worker: `public/sw.js`
- Icons: `public/icons/`

## LLM Notes
- Groq is the primary provider with Nemotron as fallback.
- The system prompt is built from `docs/prompt.md` plus runtime context.
- Long chats are summarized and trimmed, with an additional context-size cap to avoid token overflows.
- Provider/model metadata is logged on the server for debugging.

## License
TBD
