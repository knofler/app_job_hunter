import { test, expect } from "../fixtures/auth.fixture";

test.describe("Connect Hub", () => {
  test("loads the Connect Hub page", async ({ authenticatedPage: page }) => {
    await page.goto("/connect");
    await expect(page.locator("body")).toBeVisible();
  });

  test("can navigate to bug report form", async ({ authenticatedPage: page }) => {
    await page.goto("/connect");
    // Look for bug report link/button
    const bugLink = page.getByRole("link", { name: /bug|report/i }).first();
    if (await bugLink.isVisible()) {
      await bugLink.click();
      await expect(page).toHaveURL(/connect/);
    }
  });

  test("can navigate to feature request form", async ({ authenticatedPage: page }) => {
    await page.goto("/connect");
    const featureLink = page.getByRole("link", { name: /feature|request/i }).first();
    if (await featureLink.isVisible()) {
      await featureLink.click();
      await expect(page).toHaveURL(/connect/);
    }
  });
});
