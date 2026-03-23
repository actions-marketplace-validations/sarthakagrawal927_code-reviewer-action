import { test, expect } from "@playwright/test";
import {
  ConsoleErrorCollector,
  navigateTo,
  waitForNoSpinners,
  showNavBar,
} from "./helpers";

test.describe("Smoke tests", () => {
  const consoleErrors = new ConsoleErrorCollector();

  test.beforeEach(async ({ page }) => {
    consoleErrors.reset();
    consoleErrors.attach(page);
  });

  test.afterEach(() => {
    consoleErrors.assertNoErrors();
  });

  // ─── Page load tests ────────────────────────────────────────────────────

  test("Home page loads without errors", async ({ page }) => {
    await navigateTo(page, "/");
    await waitForNoSpinners(page);

    // Home page heading
    await expect(page.locator("h1", { hasText: "Overview" })).toBeVisible();
  });

  test("Board page loads without errors", async ({ page }) => {
    await navigateTo(page, "/board");
    await waitForNoSpinners(page);

    // Board has the "Agent Squad" sidebar heading
    await expect(
      page.locator("h2", { hasText: "Agent Squad" })
    ).toBeVisible();
  });

  test("History page loads without errors", async ({ page }) => {
    await navigateTo(page, "/history");
    await waitForNoSpinners(page);

    // History page heading
    await expect(page.locator("h1", { hasText: "History" })).toBeVisible();
  });

  test("Workspaces page loads without errors", async ({ page }) => {
    await navigateTo(page, "/workspaces");
    await waitForNoSpinners(page);

    // Workspaces page heading
    await expect(
      page.locator("h1", { hasText: "Workspaces" })
    ).toBeVisible();
  });

  test("Settings page loads without errors", async ({ page }) => {
    await navigateTo(page, "/settings");
    await waitForNoSpinners(page);

    // Settings page has the "General" category selected by default
    await expect(page.locator("text=General").first()).toBeVisible();
  });

  // ─── Navigation bar tests ──────────────────────────────────────────────

  test("Floating nav bar is visible with all nav items", async ({ page }) => {
    await navigateTo(page, "/");
    await showNavBar(page);

    const nav = page.locator("nav");
    await expect(nav).toBeVisible();

    // All 5 nav links should be present (Home, Workspaces, Board, History, Settings)
    const links = nav.locator("a");
    await expect(links).toHaveCount(5);
  });

  test("Nav bar shows current page name", async ({ page }) => {
    await navigateTo(page, "/settings");
    await showNavBar(page);

    const nav = page.locator("nav");
    // The page name is in a span with class "font-medium" inside the nav
    await expect(
      nav.locator("span.font-medium", { hasText: "Settings" })
    ).toBeVisible();
  });

  // ─── No console errors across all pages ────────────────────────────────

  test("No unexpected console errors on any page", async ({ page }) => {
    const routes = ["/", "/workspaces", "/board", "/history", "/settings"];

    for (const route of routes) {
      await navigateTo(page, route);
      await waitForNoSpinners(page);
      // Give async effects time to settle
      await page.waitForTimeout(500);
    }

    // consoleErrors.assertNoErrors() runs in afterEach
  });
});
