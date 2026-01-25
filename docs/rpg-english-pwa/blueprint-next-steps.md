# Implementation Blueprint: Next Steps (Chat, Onboarding, RPG Layout)

## Overview
Add core UX for chat + onboarding, introduce RPG-themed layout with dedicated character and settings pages, and implement provider fallback with automatic retries. Character creation uses a form-driven questionnaire and an LLM-assisted profile builder, with user-editable results and language preference (English or Portuguese).

## Implementation Phases

### Phase 1: Route Structure + RPG Layout
**Objective**: Introduce dedicated pages and a cohesive RPG-themed shell.
**Code Proposal**:
```tsx
// app/layout.tsx
import Link from "next/link";
import { SerwistClientProvider } from "@/components/serwist-provider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <SerwistClientProvider>
          <header className="rpg-topbar">
            <Link href="/">Story</Link>
            <Link href="/character">Character</Link>
            <Link href="/settings">Settings</Link>
          </header>
          <main className="rpg-shell">{children}</main>
        </SerwistClientProvider>
      </body>
    </html>
  );
}
```
**Tests**:
- Verify `/`, `/character`, and `/settings` render and share the shell.

### Phase 2: Chat UX Wired to `/api/chat`
**Objective**: Connect chat input to the LLM API with loading and error states.
**Code Proposal**:
```tsx
// components/chat-panel.tsx
const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
const [error, setError] = useState<string | null>(null);

async function sendMessage() {
  setStatus("loading");
  setError(null);
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider: "groq",
      messages: [...state.messages, { role: "user", content: input }],
      character: state.character,
      level: state.level,
      uiLanguage: state.uiLanguage,
    }),
  });

  if (!response.ok) {
    setStatus("error");
    setError("Failed to fetch response.");
    return;
  }
  const data = await response.json();
  addMessage({ role: "user", content: input });
  addMessage({ role: "assistant", content: data.output });
  setStatus("idle");
}
```
**Tests**:
- Chat send adds user and assistant messages.
- Error state renders message on non-2xx.

### Phase 3: Provider Fallback + Retry Policy
**Objective**: Automatically retry with the secondary provider on failure.
**Code Proposal**:
```ts
// lib/providers/fallback.ts
export async function runWithFallback(run, payload) {
  const providers = ["groq", "nemotron"] as const;
  let lastError;
  for (const provider of providers) {
    try {
      return await run(provider, payload);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}
```
**Tests**:
- Simulate Groq failure and confirm Nemotron fallback.
- Return 502 when both fail.

### Phase 4: Character Creation Flow (Questionnaire + LLM Fill)
**Objective**: Use a guided form and LLM-assisted profile fill, editable before save.
**Code Proposal**:
```tsx
// app/character/page.tsx
const questions = [
  { id: "theme", label: "Preferred RPG theme?" },
  { id: "motivation", label: "What drives your character?" },
  { id: "strengths", label: "Two strengths?" },
  { id: "flaws", label: "One flaw?" },
  { id: "role", label: "Preferred role (tank/support/etc.)?" },
];
```
```ts
// app/api/character/route.ts
const prompt = buildCharacterPrompt({ answers, languagePreference });
const output = await runWithFallback(prompt);
// Require strict JSON: { name, class, backstory, stats }
return NextResponse.json({ draftCharacter: output });
```
**Tests**:
- Character API returns structured draft.
- User edits and saves draft to local state.

### Phase 5: Onboarding Flow + Language Preference
**Objective**: Guide users through level selection and character setup with language choice.
**Code Proposal**:
```tsx
// components/onboarding.tsx
<label>Save character in:</label>
<select value={languagePreference}>
  <option>English</option>
  <option>Portuguese</option>
</select>
```
**Tests**:
- Onboarding persists level + language preference to local state.

### Phase 6: PWA Install UX
**Objective**: Add an explicit install button for mobile home screen.
**Code Proposal**:
```tsx
// components/install-button.tsx
const [promptEvent, setPromptEvent] = useState<any>(null);
useEffect(() => {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    setPromptEvent(event);
  });
}, []);
```
**Tests**:
- Button only shows when install prompt is available.

## Consolidated Checklist
- [ ] Add RPG layout shell with separate `/character` and `/settings` pages.
- [ ] Wire chat UI to `/api/chat` with loading and error states.
- [ ] Implement provider fallback with automatic retries.
- [ ] Build character questionnaire + `/api/character` LLM fill + editable draft.
- [ ] Add onboarding flow with language preference and level selection.
- [ ] Add PWA install button to trigger `beforeinstallprompt`.

## Notes
- Character draft should be saved in the user-selected language and remain editable before saving.
- The `/api/character` route should return a structured object (name, class, backstory, stats).
- Keep the base prompt (`docs/prompt.md`) for chat; use a targeted prompt template for character generation.
- Implement provider fallback once in `lib/providers/fallback.ts` and reuse in both chat and character routes.
