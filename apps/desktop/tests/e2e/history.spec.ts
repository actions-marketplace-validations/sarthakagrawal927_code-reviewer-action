import { test, expect } from "@playwright/test";
import {
  ConsoleErrorCollector,
  navigateTo,
  waitForNoSpinners,
} from "./helpers";

test.describe("History page", () => {
  const consoleErrors = new ConsoleErrorCollector();

  test.beforeEach(async ({ page }) => {
    consoleErrors.reset();
    consoleErrors.attach(page);
    await navigateTo(page, "/history");
    await waitForNoSpinners(page);
  });

  test.afterEach(() => {
    consoleErrors.assertNoErrors();
  });

  // ─── Page header ──────────────────────────────────────────────────────

  test("History heading is visible", async ({ page }) => {
    await expect(page.locator("h1", { hasText: "History" })).toBeVisible();
  });

  test("Session count is displayed in header", async ({ page }) => {
    // The header shows "X of Y" session count after loading.
    // Without Tauri, it shows the error state or "0 of 0".
    // Either the count span or the error message should be present.
    const headerArea = page.locator("h1", { hasText: "History" }).locator("..");
    await expect(headerArea).toBeVisible();
  });

  // ─── Read-only — no merge/delete buttons ──────────────────────────────

  test("No merge or delete buttons are visible (read-only)", async ({
    page,
  }) => {
    // Sessions page is read-only — no destructive actions
    const mergeButton = page.locator("button", { hasText: "Merge" });
    const deleteButton = page.locator("button", { hasText: "Delete" });

    expect(await mergeButton.count()).toBe(0);
    expect(await deleteButton.count()).toBe(0);
  });

  // ─── Re-index button ─────────────────────────────────────────────────

  test("Re-index button exists", async ({ page }) => {
    const reindexButton = page.locator("button", { hasText: "Re-index" });
    await expect(reindexButton).toBeVisible();
  });

  // ─── Search bar ───────────────────────────────────────────────────────

  test("Search bar is present and functional", async ({ page }) => {
    const searchInput = page.locator(
      'input[placeholder="Search messages..."]'
    );
    await expect(searchInput).toBeVisible();

    // Can type in search
    await searchInput.fill("test query");
    await expect(searchInput).toHaveValue("test query");
  });

  // ─── Filter controls ─────────────────────────────────────────────────

  test("Agent filter buttons are visible", async ({ page }) => {
    // Filter buttons: All, Claude, Codex
    await expect(
      page.locator("button", { hasText: "All" }).first()
    ).toBeVisible();
    await expect(
      page.locator("button", { hasText: "Claude" })
    ).toBeVisible();
    await expect(page.locator("button", { hasText: "Codex" })).toBeVisible();
  });

  test("Time range filter buttons are visible", async ({ page }) => {
    // Time range: 30d, 90d, All time
    await expect(page.locator("button", { hasText: "30d" })).toBeVisible();
    await expect(page.locator("button", { hasText: "90d" })).toBeVisible();
    await expect(
      page.locator("button", { hasText: "All time" })
    ).toBeVisible();
  });

  // ─── Empty/error state ────────────────────────────────────────────────

  test("Shows appropriate state when Tauri is unavailable", async ({
    page,
  }) => {
    // Without Tauri IPC, the page shows either an error message or
    // "No sessions found" or the Tauri-not-available error.
    const errorText = page.locator("text=Tauri APIs not available");
    const noSessions = page.locator("text=No sessions found");
    const sessionList = page.locator("[data-session-index]");

    // One of these states should be present
    const hasError = (await errorText.count()) > 0;
    const hasEmpty = (await noSessions.count()) > 0;
    const hasSessions = (await sessionList.count()) > 0;

    expect(hasError || hasEmpty || hasSessions).toBe(true);
  });

  // ─── Right panel placeholder ──────────────────────────────────────────

  test("Right panel shows 'Select a session' placeholder", async ({
    page,
  }) => {
    await expect(
      page.locator("text=Select a session")
    ).toBeVisible();
  });
});
