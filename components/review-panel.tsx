"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useAppState } from "@/components/app-state";
import { useLabels } from "@/components/language-label";
import { getBrowserRuntime } from "@/lib/browser-runtime";
import type { ReviewResult } from "@/lib/types";

type ReviewStatus = "idle" | "loading" | "error";

const DEFAULT_LIMITS = {
  vocabulary: 8,
  sentences: 6,
};

const DEFAULT_MESSAGE_LIMIT = 10;

const MAX_LIMITS = {
  vocabulary: 20,
  sentences: 20,
};

const MAX_MESSAGE_LIMIT = 50;

const INCREMENT = {
  vocabulary: 4,
  sentences: 4,
};

const MESSAGE_INCREMENT = 10;

export function ReviewPanel() {
  const { state } = useAppState();
  const labels = useLabels();
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [status, setStatus] = useState<ReviewStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [limits, setLimits] = useState(DEFAULT_LIMITS);
  const [messageLimit, setMessageLimit] = useState(DEFAULT_MESSAGE_LIMIT);
  const isAuthenticated = Boolean(state.user);
  const hasMessages = state.messages.length > 0;
  const canGenerate = isAuthenticated;

  const canShowMore = useMemo(() => {
    if (!review) return false;
    return (
      limits.vocabulary < MAX_LIMITS.vocabulary ||
      limits.sentences < MAX_LIMITS.sentences ||
      messageLimit < MAX_MESSAGE_LIMIT
    );
  }, [limits, messageLimit, review]);

  const fetchReview = async (
    nextLimits: typeof DEFAULT_LIMITS,
    nextMessageLimit: number
  ) => {
    if (status === "loading" || !canGenerate) return;
    setStatus("loading");
    setError(null);

    try {
      const response = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "groq",
          messageLimit: nextMessageLimit,
          character: state.character,
          level: state.level,
          uiLanguage: state.uiLanguage,
          correctionStyle: state.correctionStyle,
          rpgTheme: state.rpgTheme,
          learningGoal: state.learningGoal,
          narratorPersona: state.narratorPersona,
          limits: nextLimits,
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
        throw new Error(message || labels.reviewError);
      }

      const data = (await response.json()) as { review?: ReviewResult };
      if (!data.review) {
        throw new Error(labels.reviewError);
      }

      setLimits(nextLimits);
      setMessageLimit(nextMessageLimit);
      setReview(data.review);
      setStatus("idle");
    } catch (err) {
      const message = err instanceof Error ? err.message : labels.reviewError;
      setStatus("error");
      setError(message);
    } finally {
      getBrowserRuntime().dispatchEvent?.(new Event("app:check-version"));
    }
  };

  const handleGenerate = async () => {
    await fetchReview(limits, messageLimit);
  };

  const handleShowMore = async () => {
    const nextLimits = {
      vocabulary: Math.min(
        limits.vocabulary + INCREMENT.vocabulary,
        MAX_LIMITS.vocabulary
      ),
      sentences: Math.min(
        limits.sentences + INCREMENT.sentences,
        MAX_LIMITS.sentences
      ),
    };
    const nextMessageLimit = Math.min(
      messageLimit + MESSAGE_INCREMENT,
      MAX_MESSAGE_LIMIT
    );
    await fetchReview(nextLimits, nextMessageLimit);
  };

  return (
    <section className="panel review-panel">
      <h2>{labels.reviewTitle}</h2>
      <p className="helper-text">{labels.reviewIntro}</p>
      {!isAuthenticated ? (
        <p className="helper-text">{labels.authRequired}</p>
      ) : null}
      {!hasMessages ? (
        <p className="helper-text">{labels.reviewEmpty}</p>
      ) : null}
      <div className="review-actions">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!canGenerate || status === "loading"}
        >
          {status === "loading" ? labels.reviewLoading : labels.reviewAction}
        </button>
        {canShowMore ? (
          <button
            type="button"
            className="review-secondary"
            onClick={handleShowMore}
            disabled={!isAuthenticated || status === "loading"}
          >
            {labels.reviewShowMore}
          </button>
        ) : null}
      </div>
      {status === "error" && error ? (
        <p className="status error">{error}</p>
      ) : null}
      {review ? (
        <div className="review-results">
          <div className="review-section">
            <h3>{labels.reviewSectionVocabulary}</h3>
            {review.vocabulary.length ? (
              <div className="review-columns">
                {review.vocabulary.map((item, index) => (
                  <div
                    className="review-card review-card--vocab"
                    key={`${item.term}-${index}`}
                  >
                    {item.term ? (
                      <div className="review-row">
                        <span className="review-label">
                          {labels.reviewTermLabel}
                        </span>
                        <p className="review-term">{item.term}</p>
                      </div>
                    ) : null}
                    {item.meaning ? (
                      <div className="review-row">
                        <span className="review-label">
                          {labels.reviewMeaningLabel}
                        </span>
                        <div className="review-value">
                          <ReactMarkdown>{item.meaning}</ReactMarkdown>
                        </div>
                      </div>
                    ) : null}
                    {item.example ? (
                      <div className="review-row">
                        <span className="review-label">
                          {labels.reviewExampleLabel}
                        </span>
                        <div className="review-example">
                          <ReactMarkdown>{item.example}</ReactMarkdown>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="helper-text">{labels.reviewVocabularyEmpty}</p>
            )}
          </div>
          <div className="review-section">
            <h3>{labels.reviewSectionSentences}</h3>
            {review.sentenceImprovements.length ? (
              <div className="review-list">
                {review.sentenceImprovements.map((item, index) => (
                  <div
                    className="review-card review-card--sentence"
                    key={`${item.improved}-${index}`}
                  >
                    {item.original ? (
                      <div className="review-row">
                        <span className="review-label">
                          {labels.reviewOriginalLabel}
                        </span>
                        <div className="review-value">
                          <ReactMarkdown>{item.original}</ReactMarkdown>
                        </div>
                      </div>
                    ) : null}
                    {item.improved ? (
                      <div className="review-row">
                        <span className="review-label">
                          {labels.reviewImprovedLabel}
                        </span>
                        <div className="review-value">
                          <ReactMarkdown>{item.improved}</ReactMarkdown>
                        </div>
                      </div>
                    ) : null}
                    {item.explanation ? (
                      <div className="review-row">
                        <span className="review-label">
                          {labels.reviewExplanationLabel}
                        </span>
                        <div className="review-value review-meta">
                          <ReactMarkdown>{item.explanation}</ReactMarkdown>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="helper-text">{labels.reviewSentencesEmpty}</p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
