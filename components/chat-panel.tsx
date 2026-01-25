"use client";

import { useCallback, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useAppState } from "@/components/app-state";
import { useLabels } from "@/components/language-label";
import { getBrowserRuntime } from "@/lib/browser-runtime";
import { getEventTargetScrollTop, getEventTargetValue } from "@/lib/dom";

export function ChatPanel() {
  const {
    state,
    addMessage,
    removeMessageAt,
    clearMessages,
    persistPendingMessages,
    loadMoreMessages,
  } = useAppState();
  const labels = useLabels();
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isLoadingMoreRef = useRef(false);
  const hasUserScrolledRef = useRef(false);
  const isAuthenticated = Boolean(state.user);
  const starters = [
    labels.chatStarterFantasy,
    labels.chatStarterSciFi,
    labels.chatStarterVocabulary,
  ];

  const errorBubble = status === "error" && error ? (
    <div className="chat-message chat-message--error">
      <span className="chat-role">{labels.chatErrorTitle}</span>
      <div className="chat-bubble chat-bubble--error">
        <span className="chat-error-icon">!</span>
        <span>{labels.chatErrorTitle}</span>
      </div>
      <p className="chat-error-detail">{error}</p>
    </div>
  ) : null;

  const createTempId = () => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const sendMessageWith = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || status === "loading" || !isAuthenticated) return;

    const userTempId = createTempId();
    const nextMessages = [
      ...state.messages,
      { role: "user", content: trimmed },
    ];
    setInput("");
    setStatus("loading");
    setError(null);
    addMessage(
      { role: "user", content: trimmed, tempId: userTempId },
      { persist: false }
    );

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
        let message = "";
        try {
          const data = (await response.json()) as { error?: string };
          message = data?.error || "";
        } catch {
          const text = await response.text();
          message = text;
        }
        throw new Error(message || labels.chatError);
      }

      const data = (await response.json()) as {
        output?: string;
        provider?: string;
        model?: string;
      };
      if (!data.output) {
        throw new Error(labels.chatError);
      }

      addMessage(
        {
          role: "assistant",
          content: data.output,
          provider: data.provider,
          model: data.model,
          tempId: createTempId(),
        },
        { persist: false }
      );
      await persistPendingMessages();
      setStatus("idle");
    } catch (err) {
      const message = err instanceof Error ? err.message : labels.chatError;
      setStatus("error");
      setError(message);
      removeMessageAt(nextMessages.length - 1, { persist: false });
    } finally {
      getBrowserRuntime().dispatchEvent?.(new Event("app:check-version"));
    }
  };

  const sendMessage = async () => {
    await sendMessageWith(input);
  };

  const handleStarter = (starter: string) => {
    void sendMessageWith(starter);
  };

  const handleLoadMore = useCallback(async () => {
    if (
      isLoadingMoreRef.current ||
      isLoadingMore ||
      !isAuthenticated ||
      !state.hasMoreMessages
    ) {
      return;
    }
    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    try {
      await loadMoreMessages();
    } finally {
      setIsLoadingMore(false);
      isLoadingMoreRef.current = false;
    }
  }, [isAuthenticated, isLoadingMore, loadMoreMessages, state.hasMoreMessages]);

  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      if (!hasUserScrolledRef.current) {
        hasUserScrolledRef.current = true;
      }
      const scrollTop = getEventTargetScrollTop(event.target);
      if (
        scrollTop <= 20 &&
        hasUserScrolledRef.current &&
        state.hasMoreMessages &&
        state.messages.length > 50 &&
        !isLoadingMoreRef.current
      ) {
        void handleLoadMore();
      }
    },
    [handleLoadMore, state.hasMoreMessages, state.messages.length]
  );

  return (
    <section className={`panel chat-panel text-size-${state.textSize}`}>
      <h2>{labels.chatTitle}</h2>
      <p className="helper-text">{labels.chatPurpose}</p>
      {!isAuthenticated ? (
        <p className="helper-text">{labels.authRequired}</p>
      ) : null}
      <div className="chat-window" onScroll={handleScroll}>
        {state.messages.length === 0 ? (
          <>
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
                    disabled={!isAuthenticated}
                  >
                    {starter}
                  </button>
                ))}
              </div>
            </div>
            {errorBubble}
          </>
        ) : (
          <>
            {state.hasMoreMessages ? (
              <button
                type="button"
                className="chat-load-more"
                onClick={handleLoadMore}
                disabled={!isAuthenticated || isLoadingMore}
              >
                {isLoadingMore ? labels.chatLoadingMore : labels.chatLoadMore}
              </button>
            ) : null}
            {state.messages.map((message, index) => (
              <div
                key={message.id ?? message.tempId ?? `${message.role}-${index}`}
                className={`chat-message chat-message--${message.role}`}
              >
                <span className="chat-role">
                  {message.role === "assistant" ? "Master" : "You"}
                  {message.role === "assistant" && message.provider
                    ? ` (${message.provider})`
                    : ""}
                  :
                </span>
                <div className="chat-bubble">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            {errorBubble}
          </>
        )}
      </div>
      <label htmlFor="chat-input">{labels.actionLabel}</label>
      <textarea
        id="chat-input"
        className="chat-input"
        placeholder={
          state.messages.length === 0
            ? labels.chatPlaceholderEmpty
            : labels.chatPlaceholder
        }
        value={input}
        onChange={(event) => {
          setInput(getEventTargetValue(event.target));
        }}
        rows={4}
        disabled={!isAuthenticated}
      />
      <button
        type="button"
        onClick={sendMessage}
        disabled={!isAuthenticated || !input.trim() || status === "loading"}
      >
        {status === "loading" ? labels.chatLoading : labels.chatSend}
      </button>
      <button
        type="button"
        className="chat-clear"
        onClick={clearMessages}
        disabled={!isAuthenticated}
      >
        {labels.clearChat}
      </button>
    </section>
  );
}
