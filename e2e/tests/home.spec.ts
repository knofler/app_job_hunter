import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("loads the landing page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/AI Job Hunter/);
  });

  test("shows sign-in option", async ({ page }) => {
    await page.goto("/");
    // Look for a login/sign-in link or button
    const signIn = page.getByRole("link", { name: /sign in|log in|get started/i }).first();
    await expect(signIn).toBeVisible();
  });

  test("has the health endpoint", async ({ request }) => {
    const response = await request.get("/health");
    expect(response.ok()).toBeTruthy();
  });
});
