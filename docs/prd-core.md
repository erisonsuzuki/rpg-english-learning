# PRD Core: RPG English Learning PWA

## Product Summary
An installable PWA that delivers an RPG story-driven English learning experience. Users create a character, choose an English level, and chat with an LLM that follows a strict prompt: story in English and teaching/corrections in Portuguese.

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
3. Create or update character profile (name, class, backstory, stats).
4. Start chatting and receive RPG narrative + corrections.
5. Reset conversation or clear chat history.

## Key Features
- RPG chat based on `docs/prompt.md` rules.
- Character profile creation and updates.
- English level selection (3 levels).
- App UI language toggle (Portuguese/English) without altering chat rules.
- Local persistence of character, settings, and chat history.
- PWA installability (manifest + service worker cache).
- LLM provider selection: Groq primary, NVIDIA Nemotron fallback.
- Context window trimming and lightweight summarization for long chats.

## Functional Requirements
- Build system prompt using `docs/prompt.md` plus runtime context (character, level, UI language).
- Send chat history with trimming and summary injection when needed.
- Provide "New Conversation" and "Clear Chat" actions.
- Store state locally with fast resume.
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

## Data Model (Local)
- Character: name, class, backstory, stats
- Settings: English level, UI language
- Chat: ordered message list (role + content)

## Success Metrics
- User completes character creation and sends first message.
- Session length and message count per session.
- PWA install rate.

## Risks & Mitigations
- Token bloat from long sessions: trim history and summarize.
- LLM drift from prompt: keep strict system prompt + context block.
- Free-tier limits: expose provider selection and allow retries.

## Open Questions
- Should we add a short onboarding quiz to set English level?
- Should chat history be exportable?

## Lessons Learned
- Next 16 uses ESLint v9 with flat config; use `eslint.config.mjs` and `eslint-config-next/core-web-vitals`.
- Avoid calling `setState` inside effects; initialize from storage in the `useState` initializer.
- Context windows and lightweight summaries are required to keep long RPG sessions coherent and within token limits.
- Local-only storage keeps the project free-tier friendly and reduces backend complexity.
