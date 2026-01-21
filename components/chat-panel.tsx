"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useAppState } from "@/components/app-state";
import { useLabels } from "@/components/language-label";

export function ChatPanel() {
  const { state, addMessage } = useAppState();
  const labels = useLabels();
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const starters = [
    labels.chatStarterFantasy,
    labels.chatStarterSciFi,
    labels.chatStarterVocabulary,
  ];

  const sendMessageWith = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || status === "loading") return;

    const nextMessages = [...state.messages, { role: "user", content: trimmed }];
    setInput("");
    setStatus("loading");
    setError(null);
    addMessage({ role: "user", content: trimmed });

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "groq",
          messages: nextMessages,
          character: state.character,
          level: state.level,
          uiLanguage: state.uiLanguage,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || labels.chatError);
      }

      const data = (await response.json()) as { output?: string };
      if (!data.output) {
        throw new Error(labels.chatError);
      }

      addMessage({ role: "assistant", content: data.output });
      setStatus("idle");
    } catch (err) {
      const message = err instanceof Error ? err.message : labels.chatError;
      setStatus("error");
      setError(message);
    }
  };

  const sendMessage = async () => {
    await sendMessageWith(input);
  };

  const handleStarter = (starter: string) => {
    void sendMessageWith(starter);
  };

  return (
    <section className="panel">
      <h2>{labels.chatTitle}</h2>
      <p className="helper-text">{labels.chatPurpose}</p>
      <div className="chat-window">
        {state.messages.length === 0 ? (
          <div className="chat-empty">
            <p>{labels.chatEmpty}</p>
            <p className="helper-text">{labels.chatStartersTitle}</p>
            <div className="chat-starters">
              {starters.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  className="chat-starter"
                  onClick={() => handleStarter(starter)}
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        ) : (
          state.messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className="chat-message">
              <strong>{message.role}:</strong>
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          ))
        )}
      </div>
      <label htmlFor="chat-input">{labels.actionLabel}</label>
      <textarea
        id="chat-input"
        className="chat-input"
        placeholder={labels.chatPlaceholder}
        value={input}
        onChange={(event) => setInput(event.target.value)}
        rows={4}
      />
      <button
        type="button"
        onClick={sendMessage}
        disabled={!input.trim() || status === "loading"}
      >
        {status === "loading" ? labels.chatLoading : labels.chatSend}
      </button>
      {status === "error" && error ? <p className="status error">{error}</p> : null}
    </section>
  );
}
