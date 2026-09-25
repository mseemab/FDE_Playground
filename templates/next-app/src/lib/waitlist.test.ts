import { describe, expect, it } from "vitest";
import { waitlistSchema } from "./waitlist";

describe("waitlistSchema", () => {
  it("accepts a valid email", () => {
    expect(waitlistSchema.safeParse({ email: "ada@example.com" }).success).toBe(true);
  });

  it("rejects an invalid email with a readable message", () => {
    const result = waitlistSchema.safeParse({ email: "not-an-email" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Enter a valid email address");
  });
});
