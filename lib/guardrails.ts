import type { ChatMessage, CharacterProfile } from "@/lib/types";

type GuardrailResult =
  | { ok: true }
  | {
      ok: false;
      code: string;
      message: string;
      details?: { role?: string; length?: number };
    };

type GuardrailPattern = {
  code: string;
  message: string;
  regex: RegExp;
};

const INJECTION_PATTERNS: GuardrailPattern[] = [
  {
    code: "prompt-injection",
    message: "Input looks like a prompt injection attempt.",
    regex: /ignore (all|previous|prior) instructions/i,
  },
  {
    code: "prompt-exfiltration",
    message: "Input requests system or developer instructions.",
    regex: /(system prompt|developer message|hidden prompt)/i,
  },
  {
    code: "prompt-exfiltration",
    message: "Input requests system or developer instructions.",
    regex: /(reveal|show|print|expose).*prompt/i,
  },
  {
    code: "role-override",
    message: "Input attempts to override assistant behavior.",
    regex:
      /\b(you are now|act as|simulate)\b.{0,80}\b(assistant|system|model|developer|instructions?)\b/i,
  },
  {
    code: "jailbreak",
    message: "Input attempts to jailbreak system rules.",
    regex: /(jailbreak|dan mode|do anything now)/i,
  },
];

const SENSITIVE_PATTERNS: GuardrailPattern[] = [
  {
    code: "secret-request",
    message: "Input appears to request secrets or credentials.",
    regex: /(api|access|secret|private|bearer|auth|token|password)[-_ ]?(key|token|password)/i,
  },
  {
    code: "secret-token",
    message: "Input includes a token-like secret.",
    regex: /\b(sk-[A-Za-z0-9]{20,})\b/i,
  },
  {
    code: "secret-token",
    message: "Input includes a token-like secret.",
    regex: /\bAKIA[0-9A-Z]{16}\b/i,
  },
  {
    code: "private-key",
    message: "Input includes a private key block.",
    regex: /-----BEGIN( RSA)? PRIVATE KEY-----/i,
  },
  {
    code: "env-leak",
    message: "Input references runtime environment secrets.",
    regex: /(GROQ_API_KEY|NVIDIA_API_KEY|NEMOTRON_MODEL|GROQ_MODEL)/i,
  },
  {
    code: "auth-header",
    message: "Input includes an authorization header.",
    regex: /authorization:\s*bearer/i,
  },
];

const PROMPT_LEAK_PATTERNS: GuardrailPattern[] = [
  {
    code: "prompt-leak",
    message: "Model output appears to include system prompt content.",
    regex: /##\s*Persona/i,
  },
  {
    code: "prompt-leak",
    message: "Model output appears to include system prompt content.",
    regex: /##\s*Context/i,
  },
  {
    code: "prompt-leak",
    message: "Model output appears to include system prompt content.",
    regex: /Runtime Context/i,
  },
  {
    code: "prompt-leak",
    message: "Model output appears to include system prompt content.",
    regex: /Narrative RPG Game Master and Advanced English Tutor/i,
  },
];

const MAX_CHAT_MESSAGE_CHARS = 4000;
const MAX_CHAT_INPUT_CHARS = 16000;
const MAX_CHARACTER_ANSWER_CHARS = 2000;
const MAX_CHARACTER_INPUT_CHARS = 8000;
const MAX_CHAT_OUTPUT_CHARS = 14000;

function checkPatterns(text: string, patterns: GuardrailPattern[]): GuardrailResult {
  for (const pattern of patterns) {
    if (pattern.regex.test(text)) {
      return { ok: false, code: pattern.code, message: pattern.message };
    }
  }
  return { ok: true };
}

function guardText(
  text: string,
  patterns: GuardrailPattern[],
  maxChars?: number
): GuardrailResult {
  if (maxChars && text.length > maxChars) {
    return {
      ok: false,
      code: "input-too-large",
      message: "Input is too large.",
    };
  }
  return checkPatterns(text, patterns);
}

export function guardChatInput(messages: ChatMessage[]): GuardrailResult {
  const inputMessages = messages.filter((message) => message.role !== "system");
  const totalChars = inputMessages.reduce(
    (total, message) => total + message.content.length,
    0
  );

  if (totalChars > MAX_CHAT_INPUT_CHARS) {
    return {
      ok: false,
      code: "input-too-large",
      message: "Chat input exceeds the allowed size.",
      details: { length: totalChars },
    };
  }

  for (const message of inputMessages) {
    const sizeCheck = guardText(message.content, [], MAX_CHAT_MESSAGE_CHARS);
    if (!sizeCheck.ok) {
      return {
        ...sizeCheck,
        details: { role: message.role, length: message.content.length },
      };
    }

    const injectionCheck = checkPatterns(message.content, INJECTION_PATTERNS);
    if (!injectionCheck.ok) {
      return {
        ...injectionCheck,
        details: { role: message.role, length: message.content.length },
      };
    }

    const sensitiveCheck = checkPatterns(message.content, SENSITIVE_PATTERNS);
    if (!sensitiveCheck.ok) {
      return {
        ...sensitiveCheck,
        details: { role: message.role, length: message.content.length },
      };
    }
  }

  return { ok: true };
}

export function guardCharacterInput(
  answers: Record<string, string>
): GuardrailResult {
  const totalChars = Object.values(answers).reduce(
    (total, value) => total + value.length,
    0
  );
  if (totalChars > MAX_CHARACTER_INPUT_CHARS) {
    return {
      ok: false,
      code: "input-too-large",
      message: "Character input exceeds the allowed size.",
      details: { length: totalChars },
    };
  }

  for (const value of Object.values(answers)) {
    const sizeCheck = guardText(value, [], MAX_CHARACTER_ANSWER_CHARS);
    if (!sizeCheck.ok) {
      return { ...sizeCheck, details: { length: value.length } };
    }

    const injectionCheck = checkPatterns(value, INJECTION_PATTERNS);
    if (!injectionCheck.ok) {
      return { ...injectionCheck, details: { length: value.length } };
    }

    const sensitiveCheck = checkPatterns(value, SENSITIVE_PATTERNS);
    if (!sensitiveCheck.ok) {
      return { ...sensitiveCheck, details: { length: value.length } };
    }
  }

  return { ok: true };
}

export function guardChatOutput(output: string): GuardrailResult {
  const sizeCheck = guardText(output, [], MAX_CHAT_OUTPUT_CHARS);
  if (!sizeCheck.ok) return sizeCheck;

  const promptLeakCheck = checkPatterns(output, PROMPT_LEAK_PATTERNS);
  if (!promptLeakCheck.ok) return promptLeakCheck;

  const sensitiveCheck = checkPatterns(output, SENSITIVE_PATTERNS);
  if (!sensitiveCheck.ok) return sensitiveCheck;

  return { ok: true };
}

export function guardCharacterOutput(raw: string): GuardrailResult {
  const promptLeakCheck = checkPatterns(raw, PROMPT_LEAK_PATTERNS);
  if (!promptLeakCheck.ok) return promptLeakCheck;

  const sensitiveCheck = checkPatterns(raw, SENSITIVE_PATTERNS);
  if (!sensitiveCheck.ok) return sensitiveCheck;

  const trimmed = raw.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    return {
      ok: false,
      code: "invalid-format",
      message: "Character output must be strict JSON.",
    };
  }

  try {
    JSON.parse(trimmed);
  } catch {
    return {
      ok: false,
      code: "invalid-format",
      message: "Character output must be strict JSON.",
    };
  }

  return { ok: true };
}

export function validateCharacterProfile(
  profile: CharacterProfile
): GuardrailResult {
  const fields = [profile.name, profile.class, profile.backstory, profile.stats];
  if (!fields.some((value) => value && value.trim())) {
    return {
      ok: false,
      code: "invalid-profile",
      message: "Character output is missing required fields.",
    };
  }
  return { ok: true };
}
