"use client";

import { useState } from "react";
import { useAppState } from "@/components/app-state";
import { useLabels } from "@/components/language-label";

export function ChatPanel() {
  const { state } = useAppState();
  const labels = useLabels();
  const [input, setInput] = useState("");

  return (
    <section className="panel">
      <h2>{labels.chatTitle}</h2>
      <div className="chat-window">
        {state.messages.length === 0
          ? "Chat messages will appear here once the LLM is connected."
          : state.messages.map((message, index) => (
              <p key={`${message.role}-${index}`}>
                <strong>{message.role}:</strong> {message.content}
              </p>
            ))}
      </div>
      <label htmlFor="chat-input">{labels.actionLabel}</label>
      <input
        id="chat-input"
        placeholder="Describe what your character does..."
        value={input}
        onChange={(event) => setInput(event.target.value)}
      />
      <button type="button" disabled={!input.trim()}>
        Send
      </button>
    </section>
  );
}
