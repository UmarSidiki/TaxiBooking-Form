import { expect, type Page } from "@playwright/test";

const ADMIN = { email: "admin@e2e.example", password: "e2e-password" } as const;

type SignInOptions = {
  email?: string;
  password?: string;
  path?: string;
};

/**
 * Signs in through the dashboard credentials form.
 *
 * The form is a client component: filling before React hydrates leaves the
 * controlled inputs empty once hydration commits. `data-ready` is set in the
 * form ref callback, so waiting for it guarantees hydration has completed.
 */
export async function signInAdmin(
  page: Page,
  {
    email = ADMIN.email,
    password = ADMIN.password,
    path = "/en/dashboard/signin",
  }: SignInOptions = {},
) {
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 180_000 });
  await page.locator("form[data-ready=true]").waitFor({ state: "visible", timeout: 120_000 });

  const emailField = page.locator("#email");
  const passwordField = page.locator("#password");
  await emailField.fill(email);
  await passwordField.fill(password);

  try {
    await expect(emailField).toHaveValue(email, { timeout: 5_000 });
    await expect(passwordField).toHaveValue(password, { timeout: 5_000 });
  } catch {
    // A late hydration commit can still clear the first fill; one retry wins.
    await emailField.fill(email);
    await passwordField.fill(password);
    await expect(emailField).toHaveValue(email);
    await expect(passwordField).toHaveValue(password);
  }

  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.includes("signin"), { timeout: 120_000 });
  await page.waitForLoadState("domcontentloaded");
}
