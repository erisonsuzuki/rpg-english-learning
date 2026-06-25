# State Persistence

- Persist authenticated user settings through `user_settings` and treat URL query params as signed-out-only fallbacks. (Prevents query strings from overriding the per-user Supabase state model.)
- Keep allowed settings values aligned across `components/settings-panel.tsx`, `lib/defaults.ts`, and `lib/supabase/user-settings.ts`. (Prevents persisted values, defaults, and UI options from drifting out of sync.)
