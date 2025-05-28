import { test, expect } from '@playwright/test';

test.describe('Tag Selection System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load by checking for columns
    await expect(page.locator('text=idea')).toBeVisible();
    
    // Create some sample cards with tags
    await page.keyboard.press('Insert');
    await page.keyboard.type('#bug Fix login issue');
    await page.keyboard.press('Escape');
    
    await page.keyboard.press('Insert');
    await page.keyboard.type('#feature Add dark mode');
    await page.keyboard.press('Escape');
    
    await page.keyboard.press('Insert');
    await page.keyboard.type('#bug #urgent Critical crash');
    await page.keyboard.press('Escape');
    
    // Wait for tag selector to appear
    await expect(page.locator('[data-testid="tag-selector"]')).toBeVisible();
  });

  test('should enter tag selection mode with # key', async ({ page }) => {
    // Press # to enter tag mode
    await page.keyboard.press('#');
    
    // Verify tag selector is visible and active
    await expect(page.locator('[data-testid="tag-selector"]')).toBeVisible();
    await expect(page.locator('[data-testid="tag-prefix"]')).toBeVisible();
    await expect(page.locator('[data-testid="tag-prefix"]')).toContainText('#');
    
    // Verify all tags are visible
    await expect(page.locator('[data-testid="tag-bug"]')).toBeVisible();
    await expect(page.locator('[data-testid="tag-feature"]')).toBeVisible();
    await expect(page.locator('[data-testid="tag-urgent"]')).toBeVisible();
  });

  test('should switch to preview mode when typing after #', async ({ page }) => {
    // Enter tag mode and type
    await page.keyboard.press('#');
    await page.keyboard.type('bu');
    
    // Verify prefix shows "#bu"
    await expect(page.locator('[data-testid="tag-prefix"]')).toContainText('#bu');
    
    // Verify only #bug is glowing (focused)
    await expect(page.locator('[data-testid="tag-bug"][data-glowing="true"]')).toBeVisible();
    
    // Verify #feature and #urgent are darkened
    await expect(page.locator('[data-testid="tag-feature"][data-darkened="true"]')).toBeVisible();
    await expect(page.locator('[data-testid="tag-urgent"][data-darkened="true"]')).toBeVisible();
  });

  test('should navigate tags with arrow keys', async ({ page }) => {
    // Enter tag mode
    await page.keyboard.press('#');
    
    // Initially first tag should be focused
    await expect(page.locator('[data-testid="tag-bug"][data-focused="true"]')).toBeVisible();
    
    // Navigate right
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-testid="tag-feature"][data-focused="true"]')).toBeVisible();
    await expect(page.locator('[data-testid="tag-bug"][data-focused="false"]')).toBeVisible();
    
    // Navigate right again
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-testid="tag-urgent"][data-focused="true"]')).toBeVisible();
    
    // Navigate left
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('[data-testid="tag-feature"][data-focused="true"]')).toBeVisible();
  });

  test('should select tags with Enter key', async ({ page }) => {
    // Enter tag mode and select a tag
    await page.keyboard.press('#');
    await page.keyboard.press('ArrowRight'); // Focus on #feature
    await page.keyboard.press('Enter');
    
    // Should exit tag mode and tag should be selected
    await expect(page.locator('[data-testid="tag-prefix"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="tag-feature"][data-selected="true"]')).toBeVisible();
    
    // Cards should be filtered
    const visibleCards = page.locator('[data-testid^="card-"]');
    await expect(visibleCards).toHaveCount(1); // Only card with #feature
  });

  test('should select tags with Space key', async ({ page }) => {
    // Enter tag mode and select with space
    await page.keyboard.press('#');
    await page.keyboard.press(' '); // Select first tag (#bug)
    
    // Should stay in tag mode and tag should be selected
    await expect(page.locator('[data-testid="tag-prefix"]')).toBeVisible();
    await expect(page.locator('[data-testid="tag-bug"][data-selected="true"]')).toBeVisible();
    
    // Select another with Shift+Space
    await page.keyboard.press('ArrowRight'); // Focus #feature
    await page.keyboard.press('Shift+ ');
    
    // Both should be selected
    await expect(page.locator('[data-testid="tag-bug"][data-selected="true"]')).toBeVisible();
    await expect(page.locator('[data-testid="tag-feature"][data-selected="true"]')).toBeVisible();
  });

  test('should handle escape key correctly in different modes', async ({ page }) => {
    // Manual mode: Escape should exit and restore previous selection
    await page.keyboard.press('#');
    await page.keyboard.press(' '); // Select #bug
    await page.keyboard.press('Escape');
    
    // Should exit tag mode
    await expect(page.locator('[data-testid="tag-prefix"]')).not.toBeVisible();
    
    // Enter preview mode
    await page.keyboard.press('#');
    await page.keyboard.type('bu');
    
    // First escape should return to manual mode
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="tag-prefix"]')).toContainText('#');
    
    // Second escape should exit completely
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="tag-prefix"]')).not.toBeVisible();
  });

  test('should handle tag clicks correctly', async ({ page }) => {
    // Click a tag without being in tag mode
    await page.locator('[data-testid="tag-bug"]').click();
    
    // Tag should be selected and cards filtered
    await expect(page.locator('[data-testid="tag-bug"][data-selected="true"]')).toBeVisible();
    
    // Should focus a card after selection
    await expect(page.locator('[data-focused="true"]')).toBeVisible();
    
    // Shift+click should add to selection
    await page.locator('[data-testid="tag-urgent"]').click({ modifiers: ['Shift'] });
    await expect(page.locator('[data-testid="tag-bug"][data-selected="true"]')).toBeVisible();
    await expect(page.locator('[data-testid="tag-urgent"][data-selected="true"]')).toBeVisible();
  });

  test('should handle prefix matching correctly', async ({ page }) => {
    // Enter tag mode and type partial match
    await page.keyboard.press('#');
    await page.keyboard.type('ur');
    
    // Only #urgent should match
    await expect(page.locator('[data-testid="tag-urgent"][data-glowing="true"]')).toBeVisible();
    await expect(page.locator('[data-testid="tag-bug"][data-darkened="true"]')).toBeVisible();
    await expect(page.locator('[data-testid="tag-feature"][data-darkened="true"]')).toBeVisible();
    
    // Type non-matching prefix
    await page.keyboard.type('xyz');
    
    // Should show no matches indicator
    await expect(page.locator('[data-testid="tag-prefix"] span')).toHaveClass(/text-red-400/);
  });

  test('should handle backspace correctly', async ({ page }) => {
    // Enter tag mode and type
    await page.keyboard.press('#');
    await page.keyboard.type('bu');
    
    // Verify we're in preview mode
    await expect(page.locator('[data-testid="tag-prefix"]')).toContainText('#bu');
    
    // Backspace should remove character
    await page.keyboard.press('Backspace');
    await expect(page.locator('[data-testid="tag-prefix"]')).toContainText('#b');
    
    // Backspace to just #
    await page.keyboard.press('Backspace');
    await expect(page.locator('[data-testid="tag-prefix"]')).toContainText('#');
    
    // Another backspace should exit tag mode
    await page.keyboard.press('Backspace');
    await expect(page.locator('[data-testid="tag-prefix"]')).not.toBeVisible();
  });

  test('should not trigger card edit when exiting tag mode with Enter', async ({ page }) => {
    // Focus a card first
    const firstCard = page.locator('[data-testid^="card-"]').first();
    await firstCard.click();
    await expect(firstCard).toHaveAttribute('data-focused', 'true');
    
    // Enter tag mode and exit with Enter
    await page.keyboard.press('#');
    await page.keyboard.press('Enter'); // Select first tag and exit
    
    // Card should not be in edit mode
    await expect(firstCard).toHaveAttribute('data-editing', 'false');
    
    // But filter should be applied
    await expect(page.locator('[data-testid="tag-bug"][data-selected="true"]')).toBeVisible();
  });

  test('should clear tag selection with Ctrl+K', async ({ page }) => {
    // Select a tag first
    await page.locator('[data-testid="tag-bug"]').click();
    await expect(page.locator('[data-testid="tag-bug"][data-selected="true"]')).toBeVisible();
    
    // Clear filters
    await page.keyboard.press('Control+k');
    
    // Tags should be deselected
    await expect(page.locator('[data-testid="tag-bug"][data-selected="false"]')).toBeVisible();
    
    // All cards should be visible again
    const visibleCards = page.locator('[data-testid^="card-"]');
    await expect(visibleCards).toHaveCount(3);
  });

  test('should create card with tags when tags are selected', async ({ page }) => {
    // Select tags
    await page.locator('[data-testid="tag-bug"]').click();
    
    // Create new card
    await page.keyboard.press('Insert');
    
    // New card should have tags pre-filled with cursor at start
    const newCard = page.locator('[data-editing="true"] textarea');
    await expect(newCard).toBeVisible();
    
    const content = await newCard.inputValue();
    expect(content).toMatch(/\n#bug/);
    
    // Cursor should be at the start
    const selectionStart = await newCard.evaluate((el: HTMLTextAreaElement) => el.selectionStart);
    expect(selectionStart).toBe(0);
  });
});