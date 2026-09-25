import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Button } from "./button";

afterEach(cleanup);

describe("Button", () => {
  it("renders a button with variant data attributes", () => {
    render(<Button variant="outline">Join</Button>);
    const button = screen.getByRole("button", { name: "Join" });
    expect(button.dataset.variant).toBe("outline");
    expect(button.className).toContain("border");
  });

  it("renders its child element when asChild is set", () => {
    render(
      <Button asChild>
        <a href="/privacy">Privacy</a>
      </Button>,
    );
    expect(screen.getByRole("link", { name: "Privacy" }).getAttribute("href")).toBe("/privacy");
  });
});
