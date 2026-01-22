type Provider = "groq" | "nemotron";

export async function runWithFallback<T>(
  run: (provider: Provider) => Promise<T>,
  preferred?: Provider
): Promise<{ result: T; provider: Provider }> {
  const providers: Provider[] = preferred === "nemotron"
    ? ["nemotron", "groq"]
    : ["groq", "nemotron"];

  let lastError: unknown;

  for (const provider of providers) {
    try {
      const result = await run(provider);
      return { result, provider };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn("LLM provider failed", { provider, message });
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("All providers failed");
}
