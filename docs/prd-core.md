# PRD Core: RPG English Learning PWA

## LLM Context Files Reference
- `AGENTS.md`: repository structure, commands, code style, and operational rules.

## Product Summary
An installable PWA that delivers an RPG story-driven English learning experience. Users authenticate with a magic link, create a character, choose an English level, and chat with an LLM that follows a strict prompt: story in English and teaching/corrections in Portuguese.

## Goals
- Provide a fluid, immersive RPG narrative that teaches English.
- Make the app installable on mobile and desktop with offline-ready shell.
- Keep the experience free to run using a free-tier LLM provider.

## Non-Goals
- Real-time multiplayer.
- Offline LLM inference.
- Paid subscriptions or billing.

## Target Users
- Portuguese-speaking learners who want to practice English through interactive storytelling.
- Mobile-first learners who want an app-like experience.

## Core User Flows
1. Open the app and see the RPG English onboarding experience.
2. Set English level (Beginner/Intermediate/Advanced).
3. Create or update character profile (name, class, backstory, stats, weakness).
4. Start chatting and receive RPG narrative + corrections.
5. Reset conversation or clear chat history.

## Key Features
- RPG chat based on `docs/prompt.md` rules.
- Character profile creation and updates.
- English level selection (3 levels).
- App UI language toggle (Portuguese/English) without altering chat rules.
- Supabase-backed persistence of character and chat history per user.
- PWA installability (manifest + service worker cache).
- LLM provider selection: Groq primary, NVIDIA Nemotron fallback.
- Context window trimming and lightweight summarization for long chats.
- Magic-link authentication via email.

## Functional Requirements
- Build system prompt using `docs/prompt.md` plus runtime context (character, level, UI language).
- Send chat history with trimming and summary injection when needed.
- Provide "New Conversation" and "Clear Chat" actions.
- Store character and chat messages in Supabase, keyed by authenticated user.
- Authenticate users via magic-link email and persist session cookies.
- Enforce row-level security policies per user.
- Service worker caches the app shell.

## UX Requirements
- Clear separation of Character, Chat, and Settings panels.
- Visible call-to-action for chat input.
- Simple language toggle for UI text.
- Mobile-friendly layout with stacked panels.

## LLM Requirements
- Use free-tier providers.
- Groq as default provider; Nemotron as fallback.
- Non-streaming response is acceptable; streaming is optional later.
- Summaries must preserve story facts, corrections, and vocabulary.

## Data Model (Supabase)
- Characters: user_id, name, class, backstory, stats, weakness, timestamps
- ChatMessages: user_id, role, content, provider, model, timestamps
- Settings remain client-side for now (level, UI language, theme, text size)
- LLM settings persist per user (correction style, RPG theme, learning goal, narrator persona)

## Success Metrics
- User completes character creation and sends first message.
- Session length and message count per session.
- PWA install rate.

## Risks & Mitigations
- Token bloat from long sessions: trim history and summarize.
- LLM drift from prompt: keep strict system prompt + context block.
- Free-tier limits: expose provider selection and allow retries.
- RLS misconfiguration: add strict per-user policies and verify with manual tests.
- Magic-link deliverability: show user-facing status and fallback instructions.

## Open Questions
- Should we add a short onboarding quiz to set English level?
- Should chat history be exportable?

## Lessons Learned
- Next 16 uses ESLint v9 with flat config; use `eslint.config.mjs` and `eslint-config-next/core-web-vitals`.
- Avoid calling `setState` inside effects; initialize from storage in the `useState` initializer.
- Context windows and lightweight summaries are required to keep long RPG sessions coherent and within token limits.
- Supabase storage provides multi-device persistence with manageable complexity at free tier.
