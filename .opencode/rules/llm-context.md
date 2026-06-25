# LLM Context

- Preserve the chat/review context pipeline as summarize -> trim by message count -> trim by character budget, while retaining the synthetic summary system message when present. (Keeps long sessions coherent without exceeding provider limits.)
