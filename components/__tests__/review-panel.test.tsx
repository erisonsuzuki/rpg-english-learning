import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ReviewPanel } from "@/components/review-panel";
import { useAppState } from "@/components/app-state";

vi.mock("@/components/app-state", () => ({
  useAppState: vi.fn(),
}));

vi.mock("@/components/language-label", () => ({
  useLabels: () => ({
    reviewTitle: "Review & Practice",
    reviewIntro: "Get improved sentences and key vocabulary from the latest chat.",
    reviewEmpty: "Send a few chat messages to generate a review.",
    reviewAction: "Generate review",
    reviewLoading: "Generating...",
    reviewShowMore: "Show more",
    reviewSectionVocabulary: "Vocabulary",
    reviewSectionSentences: "Sentence Improvements",
    reviewVocabularyEmpty: "No vocabulary items generated yet.",
    reviewSentencesEmpty: "No sentence improvements generated yet.",
    reviewOriginalLabel: "Original",
    reviewImprovedLabel: "Improved",
    reviewExplanationLabel: "Explanation",
    reviewTermLabel: "Term",
    reviewMeaningLabel: "Meaning",
    reviewExampleLabel: "Example",
    reviewError: "Could not generate the review.",
    authRequired: "Sign in to save and continue your adventure.",
  }),
}));

const useAppStateMock = vi.mocked(useAppState);

const baseState = {
  character: {},
  level: "Beginner",
  uiLanguage: "English",
  correctionStyle: "Teacher Mode",
  rpgTheme: "",
  learningGoal: "Conversation",
  narratorPersona: "Classic",
  theme: "light",
  textSize: "medium",
  hasMoreMessages: false,
};

const baseActions = {
  updateState: vi.fn(),
  updateLlmSettings: vi.fn(),
  updateCharacter: vi.fn(),
  addMessage: vi.fn(),
  removeMessageAt: vi.fn(),
  persistPendingMessages: vi.fn(),
  loadMoreMessages: vi.fn(),
  clearMessages: vi.fn(),
  resetConversation: vi.fn(),
};

describe("ReviewPanel", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("shows empty state when no messages", () => {
    useAppStateMock.mockReturnValue({
      state: {
        ...baseState,
        messages: [],
        user: { id: "user-1", email: "test@example.com" },
      },
      ...baseActions,
    } as ReturnType<typeof useAppState>);

    render(<ReviewPanel />);

    expect(
      screen.getByText("Send a few chat messages to generate a review.")
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Generate review" })).toBeEnabled();
  });

  it("renders results after fetching review", async () => {
    useAppStateMock.mockReturnValue({
      state: {
        ...baseState,
        messages: [{ role: "user", content: "I want to learn through." }],
        user: { id: "user-1", email: "test@example.com" },
      },
      ...baseActions,
    } as ReturnType<typeof useAppState>);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            review: {
              vocabulary: [
                {
                  term: "through",
                  meaning: "across or from one side to the other",
                  example: "She walked **through** the forest.",
                },
              ],
              sentenceImprovements: [
                {
                  original: "I want to learn through.",
                  improved: "I want to learn the word 'through'.",
                  explanation: "Clarified the intent.",
                },
              ],
            },
          }),
      })
    );

    render(<ReviewPanel />);

    const generateButton = await screen.findByRole("button", {
      name: "Generate review",
    });
    await act(async () => {
      fireEvent.click(generateButton);
    });

    expect((await screen.findAllByText("through")).length).toBeGreaterThan(0);
    expect(screen.getByText("Sentence Improvements")).toBeTruthy();
  });

  it("requests more items when clicking Show more", async () => {
    useAppStateMock.mockReturnValue({
      state: {
        ...baseState,
        messages: [{ role: "user", content: "I want to learn through." }],
        user: { id: "user-1", email: "test@example.com" },
      },
      ...baseActions,
    } as ReturnType<typeof useAppState>);

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          review: {
            vocabulary: [
              {
                term: "through",
                meaning: "across",
                example: "She walked through the forest.",
              },
            ],
            sentenceImprovements: [
              {
                original: "I want to learn through.",
                improved: "I want to learn the word 'through'.",
                explanation: "Clarified the intent.",
              },
            ],
          },
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<ReviewPanel />);

    const generateButton = await screen.findByRole("button", {
      name: "Generate review",
    });
    await act(async () => {
      fireEvent.click(generateButton);
    });

    const showMoreButton = await screen.findByRole("button", {
      name: "Show more",
    });
    expect(showMoreButton).toBeTruthy();

    await act(async () => {
      fireEvent.click(showMoreButton);
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const secondCall = fetchMock.mock.calls[1];
    const body = JSON.parse(secondCall?.[1]?.body as string);
    expect(body.limits).toEqual({ vocabulary: 12, sentences: 10 });
    expect(body.messageLimit).toBe(20);
  });
});
