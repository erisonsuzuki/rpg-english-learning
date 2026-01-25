"use client";

import { useMemo, useState } from "react";
import { useAppState } from "@/components/app-state";
import { useLabels } from "@/components/language-label";
import { getBrowserRuntime } from "@/lib/browser-runtime";
import { getEventTargetValue } from "@/lib/dom";

const QUESTION_IDS = ["theme", "motivation", "strengths", "flaws", "role"] as const;

type Answers = Record<(typeof QUESTION_IDS)[number], string>;

const emptyAnswers = QUESTION_IDS.reduce((acc, questionId) => {
  acc[questionId] = "";
  return acc;
}, {} as Answers);

export function CharacterBuilder() {
  const { state, updateCharacter } = useAppState();
  const labels = useLabels();
  const isAuthenticated = Boolean(state.user);
  const [answers, setAnswers] = useState<Answers>(emptyAnswers);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastEditedId, setLastEditedId] = useState<keyof Answers | null>(null);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const questions = useMemo<{ id: keyof Answers; label: string }[]>(
    () => [
      { id: "theme", label: labels.characterQuestionTheme },
      { id: "motivation", label: labels.characterQuestionMotivation },
      { id: "strengths", label: labels.characterQuestionStrengths },
      { id: "flaws", label: labels.characterQuestionFlaws },
      { id: "role", label: labels.characterQuestionRole },
    ],
    [labels]
  );

  const hasAnswers = useMemo(
    () => Object.values(answers).some((value) => value.trim()),
    [answers]
  );

  const updateAnswer = (id: keyof Answers, value: string) => {
    setLastEditedId(id);
    if (error) setError(null);
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasAnswers || status === "loading" || !isAuthenticated) return;

    setStatus("loading");
    setError(null);

    try {
      const response = await fetch("/api/character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          languagePreference: state.uiLanguage,
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
        throw new Error(message || labels.characterBuilderError);
      }

      const data = (await response.json()) as {
        draftCharacter?: {
          name?: string;
          class?: string;
          backstory?: string;
          stats?: string;
        };
      };

      if (!data.draftCharacter) {
        throw new Error(labels.characterBuilderError);
      }

      updateCharacter(data.draftCharacter);
      setStatus("idle");
    } catch (err) {
      const message = err instanceof Error ? err.message : labels.characterBuilderError;
      setError(message);
      setStatus("error");
    } finally {
      getBrowserRuntime().dispatchEvent?.(new Event("app:check-version"));
    }
  };

  return (
    <section className="panel">
      <h2>{labels.characterHelpTitle}</h2>
      <p className="helper-text">{labels.characterHelpIntro}</p>
      {!isAuthenticated ? (
        <p className="helper-text">{labels.authRequired}</p>
      ) : null}
      <button
        type="button"
        onClick={() => setShowQuestionnaire((prev) => !prev)}
        disabled={!isAuthenticated}
      >
        {showQuestionnaire ? labels.characterHelpHide : labels.characterHelpAction}
      </button>
      {showQuestionnaire ? (
        <form className="stacked-form" onSubmit={handleSubmit}>
          {questions.map((question) => (
            <div key={question.id} className="form-row">
              <label htmlFor={`character-${question.id}`}>{question.label}</label>
                <input
                  id={`character-${question.id}`}
                  value={answers[question.id]}
                  onChange={(event) => {
                    updateAnswer(question.id, getEventTargetValue(event.target));
                  }}
                />
              {error && (lastEditedId ?? questions[0]?.id) === question.id ? (
                <p className="form-error">{error}</p>
              ) : null}
            </div>
          ))}
          <button
            type="submit"
            disabled={!hasAnswers || status === "loading" || !isAuthenticated}
          >
            {status === "loading"
              ? labels.characterBuilderLoading
              : labels.characterBuilderAction}
          </button>
        </form>
      ) : null}
    </section>
  );
}
