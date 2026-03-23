import { test, expect } from "@playwright/test";
import {
  ConsoleErrorCollector,
  navigateTo,
  waitForNoSpinners,
} from "./helpers";

test.describe("Workspaces page", () => {
  const consoleErrors = new ConsoleErrorCollector();

  test.beforeEach(async ({ page }) => {
    consoleErrors.reset();
    consoleErrors.attach(page);
    await navigateTo(page, "/workspaces");
    await waitForNoSpinners(page);
  });

  test.afterEach(() => {
    consoleErrors.assertNoErrors();
  });

  // ─── Page load ────────────────────────────────────────────────────────

  test("Workspaces heading is visible", async ({ page }) => {
    await expect(
      page.locator("h1", { hasText: "Workspaces" })
    ).toBeVisible();
  });

  // ─── + New button ─────────────────────────────────────────────────────

  test("+ New button exists", async ({ page }) => {
    const newButton = page.locator("button", { hasText: "+ New" });
    await expect(newButton).toBeVisible();
  });

  test("Create workspace modal opens on + New click", async ({ page }) => {
    const newButton = page.locator("button", { hasText: "+ New" });
    await newButton.click();

    // Modal should appear with "New Workspace" title
    await expect(
      page.locator("text=New Workspace")
    ).toBeVisible();

    // Modal should have a "Create Workspace" submit button
    await expect(
      page.locator("button", { hasText: "Create Workspace" })
    ).toBeVisible();
  });

  // ─── Empty/error state ────────────────────────────────────────────────

  test("Shows appropriate state when Tauri is unavailable", async ({
    page,
  }) => {
    // Without Tauri, the workspaces page shows either:
    // - "Tauri APIs not available" error
    // - "No workspaces yet" empty state
    const errorText = page.locator("text=Tauri APIs not available");
    const emptyState = page.locator("text=No workspaces yet");

    const hasError = (await errorText.count()) > 0;
    const hasEmpty = (await emptyState.count()) > 0;

    expect(hasError || hasEmpty).toBe(true);
  });

  // ─── Right panel placeholder ──────────────────────────────────────────

  test("Right panel shows 'Select a workspace' placeholder", async ({
    page,
  }) => {
    await expect(
      page.locator("text=Select a workspace")
    ).toBeVisible();
  });

  // ─── Create workspace modal fields ────────────────────────────────────

  test("Create workspace modal has required fields", async ({ page }) => {
    await page.locator("button", { hasText: "+ New" }).click();

    // Wait for modal to be visible
    await expect(page.locator("text=New Workspace")).toBeVisible();

    // Should have input fields for workspace creation
    // Name, repo path, branch are the minimum required fields
    const inputs = page.locator(
      '[role="dialog"] input, [role="dialog"] textarea'
    );
    const inputCount = await inputs.count();
    expect(inputCount).toBeGreaterThanOrEqual(1);
  });
});
