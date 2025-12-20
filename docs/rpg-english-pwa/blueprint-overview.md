# Implementation Blueprint: RPG English Learning PWA

## Overview
Build a Next.js PWA (installable + cached) that delivers an RPG English-learning chat experience powered by a free-tier LLM (Groq primary, NVIDIA Nemotron fallback). The app uses a fixed system prompt from `docs/prompt.md`, supports character creation, English level selection, and chat reset, with local-only storage by default.

## Implementation Phases

### Phase 1: Project Scaffolding + App Shell
**Objective**: Establish Next.js app, core routes, and baseline UI layout.
**Code Proposal**:
```tsx
// app/page.tsx
import { ChatPanel } from "@/components/chat-panel";
import { ProfilePanel } from "@/components/profile-panel";
import { SettingsPanel } from "@/components/settings-panel";

export default function HomePage() {
  return (
    <main className="app-shell">
      <header className="app-header">RPG English Learning</header>
      <section className="app-body">
        <ProfilePanel />
        <ChatPanel />
        <SettingsPanel />
      </section>
    </main>
  );
}
```
**Tests**:
- Verify root page renders shell and key panels.

### Phase 2: LLM Integration (Groq primary, Nemotron fallback)
**Objective**: Add a server route that builds the system prompt and forwards chat to the chosen LLM with provider-specific adapters.
**Code Proposal**:
```ts
// app/api/chat/route.ts
import { NextResponse } from "next/server";
import { buildSystemPrompt } from "@/lib/prompt";
import { groqChat } from "@/lib/providers/groq";
import { nemotronChat } from "@/lib/providers/nemotron";
import { trimMessages } from "@/lib/context";
import { maybeSummarize } from "@/lib/summary";

export async function POST(req: Request) {
  const body = await req.json();
  const { messages, character, level, uiLanguage, provider } = body;
  const system = buildSystemPrompt({ character, level, uiLanguage });
  const summarized = await maybeSummarize(messages);
  const trimmed = trimMessages(summarized);
  const payload = [{ role: "system", content: system }, ...trimmed];

  const run = provider === "nemotron" ? nemotronChat : groqChat;
  const output = await run(payload);
  return NextResponse.json({ output });
}
```
**Tests**:
- Unit test `buildSystemPrompt` uses `docs/prompt.md` and injects character + level.
- Unit test `trimMessages` enforces the context window limit.
- Unit test `maybeSummarize` only triggers after the threshold.
- API handler returns response with mocked provider.

### Phase 3: Local Storage + Domain State
**Objective**: Persist character, level, language, and chat history locally.
**Code Proposal**:
```ts
// lib/storage.ts
const KEY = "rpg-english-state-v1";

export function loadState() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveState(state: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
}
```
**Tests**:
- Store/load roundtrip for character + level + history.

### Phase 4: UI Features (Profile, Level, Language, Chat Reset)
**Objective**: Build user flows for character creation, English level, UI language, and chat reset.
**Code Proposal**:
```tsx
// components/settings-panel.tsx
export function SettingsPanel() {
  return (
    <section>
      <h2>Settings</h2>
      <label>English Level</label>
      <select>{["Beginner", "Intermediate", "Advanced"].map((lvl) => (
        <option key={lvl}>{lvl}</option>
      ))}</select>
      <label>App Language</label>
      <select>{["Portuguese", "English"].map((lng) => (
        <option key={lng}>{lng}</option>
      ))}</select>
      <button>New Conversation</button>
      <button>Clear Chat</button>
    </section>
  );
}
```
**Tests**:
- Settings changes update state and persist.
- "New Conversation" clears history only.

### Phase 5: PWA Install + Cache
**Objective**: Add manifest, icons, and service worker caching for the shell.
**Code Proposal**:
```json
// public/manifest.json
{
  "name": "RPG English Learning",
  "short_name": "RPG English",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f5f0e6",
  "theme_color": "#1f2937",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```
**Tests**:
- Lighthouse PWA checklist pass for installability.

## Consolidated Checklist
- [x] Initialize Next.js app structure, base layout, and core panels.
- [x] Implement LLM API route + prompt builder using Groq primary and Nemotron fallback.
- [x] Add local-only storage for character, level, language, and chat history.
- [x] Build profile editor, level selector (3 levels), language toggle, and chat reset UX.
- [x] Configure PWA manifest, icons, and caching for the app shell.

## Notes
- LLM choice: Groq is recommended as the primary free-tier provider for fast OpenAI-compatible APIs; Nemotron is kept as a fallback option using the NVIDIA endpoint shown in `docs/nvidia_nemotron_usage.md`.
- Storage: default to local-only for zero-cost operation; optional future sync could use a free tier like Supabase/Firebase if needed.
- The chat must follow `docs/prompt.md` rules: story in English, teaching in Portuguese, and onboarding intro in Portuguese.
- Provider adapters will normalize the API: Groq uses a responses-style endpoint, Nemotron uses chat-completions; both return a single assistant text output to the route.
- A context window limit will keep the story coherent while controlling token usage.
- A lightweight summary step will condense older turns into a single synthetic system message prepended before the latest turns.
- Streaming responses can be a later enhancement; initial implementation can return full responses for simplicity.
