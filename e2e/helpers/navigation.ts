import type { Page } from "@playwright/test";

export async function navigateTo(page: Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle" });
}

export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState("networkidle");
}

export async function getPageTitle(page: Page): Promise<string> {
  return page.title();
}
