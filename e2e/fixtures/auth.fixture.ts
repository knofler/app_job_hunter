import { test as base, type Page } from "@playwright/test";

/**
 * Auth fixture: injects a session cookie so tests bypass Auth0 login.
 *
 * Strategy: intercept the /api/auth/me endpoint and return a mock user,
 * then set the appSession cookie so the Auth0 SDK thinks we're logged in.
 *
 * For tests that need real Auth0, use AUTH0_TEST_EMAIL / AUTH0_TEST_PASSWORD
 * env vars and the loginViaUI helper.
 */

interface AuthFixtures {
  authenticatedPage: Page;
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Mock the Auth0 /api/auth/me endpoint
    await page.route("**/api/auth/me", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          sub: "auth0|test-user-e2e",
          name: "E2E Test User",
          email: "e2e@test.local",
          email_verified: true,
          nickname: "e2e-tester",
          picture: "",
          updated_at: new Date().toISOString(),
          org_id: "org_test",
        }),
      })
    );

    // Mock the /api/auth/token endpoint (for API calls that need a token)
    await page.route("**/api/auth/token", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ accessToken: "mock-access-token-e2e" }),
      })
    );

    await use(page);
  },
});

export { expect } from "@playwright/test";
