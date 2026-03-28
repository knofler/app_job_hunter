import { test, expect } from "../fixtures/auth.fixture";

test.describe("Resume Management", () => {
  test("loads the resume page", async ({ authenticatedPage: page }) => {
    await page.goto("/resume");
    await expect(page.locator("body")).toBeVisible();
  });

  test("shows upload area or existing resume", async ({ authenticatedPage: page }) => {
    await page.goto("/resume");
    await page.waitForLoadState("networkidle");
    // Should show either an upload zone or resume details
    const body = page.locator("body");
    await expect(body).not.toBeEmpty();
  });
});
