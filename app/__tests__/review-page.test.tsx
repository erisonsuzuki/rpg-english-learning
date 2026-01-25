import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ReviewPage from "@/app/review/page";

vi.mock("@/components/review-content", () => ({
  ReviewContent: () => <div>Review Content Stub</div>,
}));

describe("ReviewPage", () => {
  it("renders the review panel", () => {
    render(<ReviewPage />);

    expect(screen.getByText("Review Content Stub")).toBeTruthy();
  });
});
