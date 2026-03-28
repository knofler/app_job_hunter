import { test, expect } from "../fixtures/auth.fixture";

test.describe("Job Search", () => {
  test("loads the job search page", async ({ authenticatedPage: page }) => {
    await page.goto("/job-search");
    await expect(page.locator("body")).toBeVisible();
  });

  test("displays job listings or empty state", async ({ authenticatedPage: page }) => {
    await page.goto("/job-search");
    // Page should have content — either jobs or an empty state message
    await page.waitForLoadState("networkidle");
    const body = page.locator("body");
    await expect(body).not.toBeEmpty();
  });
});
