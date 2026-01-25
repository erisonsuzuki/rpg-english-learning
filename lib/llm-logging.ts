type LlmRequestLog = {
  feature: "chat" | "character" | "review";
  preferredProvider: string;
  messageCount: number;
  originalMessages?: number;
  contextChars?: number;
  finalChars?: number;
  limits?: { vocabulary: number; sentences: number };
  answerCount?: number;
  totalAnswerChars?: number;
  payloadChars?: number;
};

type LlmResponseLog = {
  feature: "chat" | "character" | "review";
  provider: string;
  model?: string;
  usage?: unknown;
};

export function logLlmRequest(data: LlmRequestLog) {
  console.info("LLM request", data);
}

export function logLlmResponse(data: LlmResponseLog) {
  console.info("LLM response", data);
}
