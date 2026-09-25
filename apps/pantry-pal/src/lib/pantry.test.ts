import { describe, expect, it } from "vitest";
import {
  addItemSchema,
  daysUntil,
  expiryLabel,
  isoToday,
  markItemSchema,
  splitPantry,
} from "./pantry";

const today = "2026-09-25";

describe("addItemSchema", () => {
  it("trims the name and treats an empty date as no expiry", () => {
    expect(addItemSchema.parse({ name: "  Milk ", expiresOn: "" })).toEqual({
      name: "Milk",
      expiresOn: null,
    });
    expect(addItemSchema.parse({ name: "Milk" })).toEqual({ name: "Milk", expiresOn: null });
  });

  it("accepts an ISO date", () => {
    expect(addItemSchema.parse({ name: "Milk", expiresOn: "2026-09-30" }).expiresOn).toBe(
      "2026-09-30",
    );
  });

  it("rejects blank names, long names and bad dates with readable messages", () => {
    expect(addItemSchema.safeParse({ name: "   " }).error?.issues[0]?.message).toBe(
      "Give the item a name",
    );
    expect(addItemSchema.safeParse({ name: "x".repeat(81) }).success).toBe(false);
    expect(
      addItemSchema.safeParse({ name: "Milk", expiresOn: "30/09/2026" }).error?.issues[0]?.message,
    ).toBe("Pick a valid date");
  });
});

describe("markItemSchema", () => {
  it("only allows used or discarded on a uuid", () => {
    const id = "3f1c2a3e-8b4d-4c1e-9f0a-1b2c3d4e5f60";
    expect(markItemSchema.safeParse({ id, status: "used" }).success).toBe(true);
    expect(markItemSchema.safeParse({ id, status: "in_pantry" }).success).toBe(false);
    expect(markItemSchema.safeParse({ id: "1", status: "used" }).success).toBe(false);
  });
});

describe("dates", () => {
  it("computes whole days until a date", () => {
    expect(daysUntil("2026-09-28", today)).toBe(3);
    expect(daysUntil("2026-09-24", today)).toBe(-1);
    expect(daysUntil(null, today)).toBeNull();
  });

  it("formats today in UTC", () => {
    expect(isoToday(new Date("2026-09-25T23:30:00Z"))).toBe("2026-09-25");
  });

  it("labels expiry relative to today", () => {
    expect(expiryLabel("2026-09-23", today)).toBe("Expired 2 days ago");
    expect(expiryLabel("2026-09-24", today)).toBe("Expired yesterday");
    expect(expiryLabel("2026-09-25", today)).toBe("Expires today");
    expect(expiryLabel("2026-09-26", today)).toBe("Expires tomorrow");
    expect(expiryLabel("2026-10-05", today)).toBe("Expires in 10 days");
    expect(expiryLabel(null, today)).toBe("No expiry date");
  });
});

describe("splitPantry", () => {
  it("puts items expiring within 3 days (or expired) first, soonest first", () => {
    const items = [
      { name: "Rice", expires_on: null },
      { name: "Yogurt", expires_on: "2026-09-27" },
      { name: "Eggs", expires_on: "2026-10-10" },
      { name: "Milk", expires_on: "2026-09-24" },
      { name: "Cheese", expires_on: "2026-09-28" },
    ];
    const { expiringSoon, rest } = splitPantry(items, today);
    expect(expiringSoon.map((i) => i.name)).toEqual(["Milk", "Yogurt", "Cheese"]);
    expect(rest.map((i) => i.name)).toEqual(["Eggs", "Rice"]);
  });
});
