import { describe, expect, it, vi } from "vitest";
import { matchesPath, safeRedirectPath } from "./index";
import { getUser } from "./server";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));

describe("safeRedirectPath", () => {
  it.each([
    ["/pantry", "/pantry"],
    ["/pantry?tab=soon", "/pantry?tab=soon"],
    [null, "/"],
    ["", "/"],
    ["https://evil.example", "/"],
    ["//evil.example", "/"],
    ["/\\evil.example", "/"],
    ["pantry", "/"],
  ])("%s → %s", (input, expected) => {
    expect(safeRedirectPath(input)).toBe(expected);
  });
});

describe("matchesPath", () => {
  it("matches the prefix itself and nested paths only", () => {
    expect(matchesPath("/pantry", ["/pantry"])).toBe(true);
    expect(matchesPath("/pantry/items", ["/pantry"])).toBe(true);
    expect(matchesPath("/pantryfoo", ["/pantry"])).toBe(false);
    expect(matchesPath("/", ["/pantry"])).toBe(false);
  });
});

describe("getUser", () => {
  const client = (result: unknown) => ({ auth: { getClaims: vi.fn().mockResolvedValue(result) } });

  it("returns the verified user id and email", async () => {
    const user = await getUser(
      client({ data: { claims: { sub: "u1", email: "a@b.co" } }, error: null }) as never,
    );
    expect(user).toEqual({ id: "u1", email: "a@b.co" });
  });

  it("returns null when there is no session or verification fails", async () => {
    expect(await getUser(client({ data: null, error: null }) as never)).toBeNull();
    expect(
      await getUser(
        client({ data: { claims: { sub: "u1" } }, error: new Error("bad jwt") }) as never,
      ),
    ).toBeNull();
  });
});
