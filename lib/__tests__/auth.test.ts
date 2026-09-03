import { describe, expect, it } from "vitest";
import { hashSecret, isSameOrigin } from "@/lib/auth";

describe("auth security helpers", () => {
  it("hashes secrets without retaining their plaintext value", () => {
    expect(hashSecret("session-secret")).not.toBe("session-secret");
    expect(hashSecret("session-secret")).toBe(hashSecret("session-secret"));
  });

  it("accepts only requests from the application origin", () => {
    expect(isSameOrigin("https://app.example.com", "https://app.example.com"))
      .toBe(true);
    expect(isSameOrigin("https://evil.example.com", "https://app.example.com"))
      .toBe(false);
  });
});
