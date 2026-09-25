import { expect, test } from "@playwright/test";

test("landing page renders and the waitlist form validates input", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.getByLabel("Email").fill("not-an-email");
  await page.getByRole("button", { name: "Join waitlist" }).click();
  await expect(page.locator("#email-error")).toHaveText("Enter a valid email address");

  await page.getByLabel("Email").fill("ada@example.com");
  await page.getByRole("button", { name: "Join waitlist" }).click();
  await expect(page.getByRole("status")).toContainText("on the list");
});

for (const path of ["/privacy", "/terms"]) {
  test(`${path} loads and is marked as a draft`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByText("DRAFT — needs legal review")).toBeVisible();
  });
}
