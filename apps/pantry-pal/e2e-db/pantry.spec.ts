import { execFileSync } from "node:child_process";
import { expect, test, type BrowserContext } from "@playwright/test";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

/**
 * Signed-in flow against the LOCAL Supabase stack. Google OAuth can't run headless, so the test
 * creates a user with a password and signs in through @supabase/ssr, producing the same session
 * cookies the /auth/callback route sets. Run with `pnpm test:e2e:db` (stack must be running).
 */

interface LocalStatus {
  API_URL: string;
  PUBLISHABLE_KEY: string;
  SECRET_KEY: string;
}

const status = JSON.parse(
  execFileSync("pnpm", ["exec", "supabase", "status", "-o", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }),
) as LocalStatus;
const admin = createClient(status.API_URL, status.SECRET_KEY, { auth: { persistSession: false } });

async function signIn(context: BrowserContext, baseURL: string): Promise<string> {
  const email = `e2e-${crypto.randomUUID().slice(0, 8)}@example.test`;
  const password = `pw-${crypto.randomUUID()}`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;

  const jar: { name: string; value: string }[] = [];
  const supabase = createServerClient(status.API_URL, status.PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => jar,
      setAll: (cookies) => {
        for (const c of cookies) jar.push({ name: c.name, value: c.value });
      },
    },
  });
  const result = await supabase.auth.signInWithPassword({ email, password });
  if (result.error) throw result.error;
  await context.addCookies(jar.map((c) => ({ ...c, url: baseURL })));
  return data.user.id;
}

test("signed-out visitors are sent from /pantry to the landing page", async ({ page }) => {
  await page.goto("/pantry");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
});

test("a signed-in user adds items, sees what expires soon and marks one used", async ({
  page,
  context,
  baseURL,
}) => {
  const userId = await signIn(context, baseURL ?? "");
  try {
    await page.goto("/pantry");
    await expect(page.getByRole("heading", { name: "Your pantry" })).toBeVisible();

    const soon = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    await page.getByLabel("Item").fill("Greek yogurt");
    await page.getByLabel("Expires (optional)").fill(soon);
    await page.getByRole("button", { name: "Add" }).click();

    const expiring = page.locator("section", {
      has: page.getByRole("heading", { name: "Expiring soon" }),
    });
    await expect(expiring.getByText("Greek yogurt")).toBeVisible();
    await expect(expiring.getByText("Expires tomorrow")).toBeVisible();

    await page.getByLabel("Item").fill("Rice");
    await page.getByRole("button", { name: "Add" }).click();
    const rest = page.locator("section", {
      has: page.getByRole("heading", { name: "Everything else" }),
    });
    await expect(rest.getByText("Rice")).toBeVisible();
    await expect(rest.getByText("No expiry date")).toBeVisible();

    await page.getByLabel("Item").fill("   ");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.locator("#add-item-error")).toHaveText("Give the item a name");

    await expiring
      .getByRole("listitem")
      .filter({ hasText: "Greek yogurt" })
      .getByRole("button", { name: "Used" })
      .click();
    await expect(expiring.getByText("Nothing expiring in the next 3 days.")).toBeVisible();

    await page.goto("/");
    await expect(page.getByRole("link", { name: "Open your pantry" })).toBeVisible();
  } finally {
    await admin.auth.admin.deleteUser(userId);
  }
});
