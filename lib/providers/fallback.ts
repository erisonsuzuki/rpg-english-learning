type Provider = "groq" | "nemotron";

export async function runWithFallback<T>(
  run: (provider: Provider) => Promise<T>,
  preferred?: Provider
): Promise<T> {
  const providers: Provider[] = preferred === "nemotron"
    ? ["nemotron", "groq"]
    : ["groq", "nemotron"];

  let lastError: unknown;

  for (const provider of providers) {
    try {
      return await run(provider);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("All providers failed");
}
