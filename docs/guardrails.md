# Guardrails: Prompt Injection and Sensitive Data

## Analysis of Current Mitigations

The existing flow already applies several safety-oriented controls:

- **System prompt enforcement**: The full instruction set lives in `docs/prompt.md` and is always injected server-side via `lib/prompt.ts`. This prevents client-side tampering and keeps the RPG/teaching persona consistent.
- **Runtime context separation**: Runtime fields (character, level, UI language) are appended in a distinct block, reducing the chance that user content is treated as authoritative system guidance.
- **Summarization + trimming**: `lib/summary.ts` and `lib/context.ts` limit long histories, which reduces exposure to long-tail injection attempts and keeps the model focused on recent, relevant context.
- **JSON-only character output**: `app/api/character/route.ts` already instructs the model to return strict JSON and parses the output defensively.

These controls guide behavior but do not actively block injection attempts or sensitive data leakage. The new safeguards below add explicit rejection and post-response validation.

## New Safeguards (Pre-LLM)

Applied to chat input and character answers:

- **Input size caps** to prevent oversized payloads.
- **Prompt-injection pattern detection** (e.g., "ignore previous instructions", "reveal system prompt", jailbreak phrases).
- **Sensitive-data pattern detection** (API key/token phrases, auth headers, private key blocks).

When triggered, the API returns a 400 with a safe error message and logs a warning server-side.

## New Postguards (Post-LLM)

Applied to chat outputs and character creation responses:

- **Prompt leak detection**: blocks system prompt headers or phrasing that indicates instruction leakage.
- **Sensitive data detection**: blocks responses containing token-like secrets or auth headers.
- **Strict JSON enforcement** for character creation: output must be raw JSON with no preface or markdown.

When triggered, the API returns a 502 with a safe error message and logs a warning server-side.

## Notes and Limitations

- These guardrails are heuristic and conservative; they reduce risk but cannot guarantee complete protection.
- Patterns are intentionally scoped to minimize false positives.
- If legitimate requests are blocked, adjust patterns in `lib/guardrails.ts`.
