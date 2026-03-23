import { test, expect } from "@playwright/test";
import {
  ConsoleErrorCollector,
  navigateTo,
  waitForNoSpinners,
} from "./helpers";

test.describe("Board page — kanban and task management", () => {
  const consoleErrors = new ConsoleErrorCollector();

  test.beforeEach(async ({ page }) => {
    consoleErrors.reset();
    consoleErrors.attach(page);
    await navigateTo(page, "/board");
    await waitForNoSpinners(page);
  });

  test.afterEach(() => {
    consoleErrors.assertNoErrors();
  });

  // ─── Kanban columns ───────────────────────────────────────────────────

  test("Kanban board has 5 columns", async ({ page }) => {
    const columnHeaders = page.locator(
      "text=To Do, text=In Progress, text=Review, text=Test, text=Done"
    );

    // Verify each column header individually
    await expect(
      page.locator(".uppercase.tracking-wider", { hasText: "To Do" })
    ).toBeVisible();
    await expect(
      page.locator(".uppercase.tracking-wider", { hasText: "In Progress" })
    ).toBeVisible();
    await expect(
      page.locator(".uppercase.tracking-wider", { hasText: "Review" })
    ).toBeVisible();
    await expect(
      page.locator(".uppercase.tracking-wider", { hasText: "Test" })
    ).toBeVisible();
    await expect(
      page.locator(".uppercase.tracking-wider", { hasText: "Done" })
    ).toBeVisible();
  });

  // ─── Agent Squad sidebar ──────────────────────────────────────────────

  test("Agent squad sidebar is visible", async ({ page }) => {
    await expect(
      page.locator("h2", { hasText: "Agent Squad" })
    ).toBeVisible();
  });

  // ─── Concurrency indicator ────────────────────────────────────────────

  test("Concurrency indicator shows agent count", async ({ page }) => {
    // Header shows "X/Y agents" format (e.g. "0/3 agents")
    await expect(page.locator("text=/\\d+\\/\\d+ agents/")).toBeVisible();
  });

  // ─── Task creation ────────────────────────────────────────────────────

  test("+ Task button exists and opens create task dialog", async ({
    page,
  }) => {
    const addTaskButton = page.locator("button", { hasText: "+ Task" });
    await expect(addTaskButton).toBeVisible();

    await addTaskButton.click();

    // The create task dialog/panel should appear with the "New Task" heading
    await expect(
      page.locator("h3", { hasText: "New Task" })
    ).toBeVisible();

    // It should have a title input
    await expect(
      page.locator('input[placeholder="Task title"]')
    ).toBeVisible();

    // It should have a Create button (exact match to avoid "Create one")
    await expect(
      page.locator("button", { hasText: /^Create$/ })
    ).toBeVisible();
  });

  test("Can fill out task creation form", async ({ page }) => {
    // Open create task panel
    await page.locator("button", { hasText: "+ Task" }).click();
    await expect(
      page.locator("h3", { hasText: "New Task" })
    ).toBeVisible();

    // Fill in task title
    const titleInput = page.locator('input[placeholder="Task title"]');
    await titleInput.fill("Test task from Playwright");

    // Fill in description
    const descriptionInput = page.locator(
      'textarea[placeholder="Description"]'
    );
    await descriptionInput.fill("This is an automated test task");

    // The Create button should be enabled now (title is filled)
    const createButton = page.locator("button", { hasText: /^Create$/ });
    await expect(createButton).toBeEnabled();
  });

  // ─── Task click → persona picker ─────────────────────────────────────

  test("Empty kanban columns show 'No tasks' placeholder", async ({
    page,
  }) => {
    // Without Tauri, tasks list will be empty. Each column shows "No tasks"
    const noTasksLabels = page.locator("text=No tasks");
    // All 5 columns should show "No tasks" when empty
    const count = await noTasksLabels.count();
    expect(count).toBe(5);
  });
});
