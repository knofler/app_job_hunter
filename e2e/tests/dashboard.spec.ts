import { test, expect } from "../fixtures/auth.fixture";

test.describe("Dashboard (authenticated)", () => {
  test("loads dashboard for authenticated user", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard");
    // Should not redirect to login
    await expect(page).not.toHaveURL(/auth\/login/);
    // Should show dashboard content
    await expect(page.locator("body")).toBeVisible();
  });

  test("shows navigation sidebar", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard");
    // Check for key nav items
    const nav = page.getByRole("navigation");
    await expect(nav).toBeVisible();
  });
});
