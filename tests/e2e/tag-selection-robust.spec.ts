import { test, expect } from '@playwright/test';

test.describe('Tag Selection System - Robust Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=idea')).toBeVisible();
    
    // Create a few simple test cards to ensure we have tags to work with
    const testCards = [
      '#bug Fix the issue',
      '#feature New functionality', 
      '#docs Update documentation'
    ];
    
    for (const content of testCards) {
      const addButtons = page.locator('text=+');
      if (await addButtons.count() > 0) {
        await addButtons.first().click();
        await expect(page.locator('[data-editing="true"]')).toBeVisible();
        await page.keyboard.type(content);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(200);
      }
    }
    
    // Wait for tag selector to appear
    await expect(page.locator('[data-testid="tag-selector"]')).toBeVisible();
  });

  test.describe('Core Functionality', () => {
    test('should enter and exit tag mode with # key', async ({ page }) => {
      // Enter tag mode
      await page.keyboard.press('#');
      await expect(page.locator('[data-testid="tag-prefix"]')).toBeVisible();
      await expect(page.locator('[data-testid="tag-prefix"]')).toContainText('#');
      
      // Should show all tags visible and one focused
      await expect(page.locator('[data-testid^="tag-"][data-darkened="false"]')).toHaveCount(3);
      await expect(page.locator('[data-testid^="tag-"][data-focused="true"]')).toHaveCount(1);
      
      // Exit with Escape
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-testid="tag-prefix"]')).not.toBeVisible();
    });

    test('should filter tags in preview mode', async ({ page }) => {
      await page.keyboard.press('#');
      await page.keyboard.type('bu'); // Should match #bug
      
      // Should show longer prefix
      await expect(page.locator('[data-testid="tag-prefix"]')).toContainText('#bu');
      
      // Only matching tags should be visible (not darkened)
      const nonDarkenedTags = page.locator('[data-testid^="tag-"][data-darkened="false"]');
      const darkenedTags = page.locator('[data-testid^="tag-"][data-darkened="true"]');
      
      // Should have fewer non-darkened tags than total
      const nonDarkenedCount = await nonDarkenedTags.count();
      const darkenedCount = await darkenedTags.count();
      
      expect(nonDarkenedCount).toBeGreaterThan(0);
      expect(darkenedCount).toBeGreaterThan(0);
      expect(nonDarkenedCount + darkenedCount).toBe(3);
    });

    test('should navigate between tags with arrow keys', async ({ page }) => {
      await page.keyboard.press('#');
      
      const firstFocused = await page.locator('[data-testid^="tag-"][data-focused="true"]').getAttribute('data-tag');
      
      // Navigate right
      await page.keyboard.press('ArrowRight');
      const secondFocused = await page.locator('[data-testid^="tag-"][data-focused="true"]').getAttribute('data-tag');
      
      // Should be different tags
      expect(firstFocused).not.toBe(secondFocused);
      
      // Navigate left
      await page.keyboard.press('ArrowLeft');
      const backToFirst = await page.locator('[data-testid^="tag-"][data-focused="true"]').getAttribute('data-tag');
      
      // Should be back to first tag
      expect(backToFirst).toBe(firstFocused);
    });

    test('should select tag with Enter and exit mode', async ({ page }) => {
      await page.keyboard.press('#');
      
      // Get the currently focused tag
      const focusedTag = await page.locator('[data-testid^="tag-"][data-focused="true"]').getAttribute('data-tag');
      const focusedTagId = focusedTag?.replace('#', '');
      
      await page.keyboard.press('Enter');
      
      // Should exit tag mode
      await expect(page.locator('[data-testid="tag-prefix"]')).not.toBeVisible();
      
      // Tag should be selected
      await expect(page.locator(`[data-testid="tag-${focusedTagId}"][data-selected="true"]`)).toBeVisible();
      
      // Should focus a card
      await expect(page.locator('[data-testid^="card-"][data-focused="true"]')).toBeVisible();
    });

    test('should toggle tag with Space key in manual mode', async ({ page }) => {
      await page.keyboard.press('#');
      
      const focusedTag = await page.locator('[data-testid^="tag-"][data-focused="true"]').getAttribute('data-tag');
      const focusedTagId = focusedTag?.replace('#', '');
      
      await page.keyboard.press(' ');
      
      // Should stay in tag mode
      await expect(page.locator('[data-testid="tag-prefix"]')).toBeVisible();
      
      // Tag should be selected
      await expect(page.locator(`[data-testid="tag-${focusedTagId}"][data-selected="true"]`)).toBeVisible();
      
      // Press space again to deselect
      await page.keyboard.press(' ');
      await expect(page.locator(`[data-testid="tag-${focusedTagId}"][data-selected="false"]`)).toBeVisible();
    });

    test('should handle preview mode correctly', async ({ page }) => {
      await page.keyboard.press('#');
      await page.keyboard.type('f'); // Should match #feature
      
      // Should be in preview mode
      await expect(page.locator('[data-testid="tag-prefix"]')).toContainText('#f');
      
      // Focused tag should have glow effect
      await expect(page.locator('[data-testid^="tag-"][data-focused="true"][data-glowing="true"]')).toBeVisible();
      
      // Space should reset to manual mode
      await page.keyboard.press(' ');
      await expect(page.locator('[data-testid="tag-prefix"]')).toContainText('#');
      
      // Should stay in tag mode
      await expect(page.locator('[data-testid="tag-prefix"]')).toBeVisible();
    });

    test('should handle no matching tags', async ({ page }) => {
      await page.keyboard.press('#');
      await page.keyboard.type('xyz'); // No matching tags
      
      // Prefix should turn red
      await expect(page.locator('[data-testid="tag-prefix"] span')).toHaveClass(/text-red-400/);
      
      // All tags should be darkened
      await expect(page.locator('[data-testid^="tag-"][data-darkened="false"]')).toHaveCount(0);
      
      // No tag should be focused
      await expect(page.locator('[data-testid^="tag-"][data-focused="true"]')).toHaveCount(0);
    });

    test('should exit tag mode with backspace at #', async ({ page }) => {
      await page.keyboard.press('#');
      await page.keyboard.press('Backspace');
      
      // Should exit tag mode
      await expect(page.locator('[data-testid="tag-prefix"]')).not.toBeVisible();
    });

    test('should handle double escape from preview mode', async ({ page }) => {
      // Pre-select a tag
      const allTags = page.locator('[data-testid^="tag-"]');
      await allTags.first().click();
      
      // Enter preview mode
      await page.keyboard.press('#');
      await page.keyboard.type('f');
      
      // First escape should return to manual mode
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-testid="tag-prefix"]')).toContainText('#');
      
      // Second escape should exit completely
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-testid="tag-prefix"]')).not.toBeVisible();
    });
  });

  test.describe('Click Interactions', () => {
    test('should handle tag clicks correctly', async ({ page }) => {
      const firstTag = page.locator('[data-testid^="tag-"]').first();
      const tagId = await firstTag.getAttribute('data-testid');
      
      // Click tag
      await firstTag.click();
      
      // Should be selected
      await expect(page.locator(`[data-testid="${tagId}"][data-selected="true"]`)).toBeVisible();
      
      // Should focus a card
      await expect(page.locator('[data-testid^="card-"][data-focused="true"]')).toBeVisible();
      
      // Click same tag again - should deselect
      await firstTag.click();
      await expect(page.locator(`[data-testid="${tagId}"][data-selected="false"]`)).toBeVisible();
    });

    test('should handle shift+click for multi-select', async ({ page }) => {
      const allTags = page.locator('[data-testid^="tag-"]');
      const firstTag = allTags.first();
      const secondTag = allTags.nth(1);
      
      // Click first tag
      await firstTag.click();
      
      // Shift+click second tag
      await secondTag.click({ modifiers: ['Shift'] });
      
      // Both should be selected
      await expect(firstTag.locator('[data-selected="true"]')).toBeVisible();
      await expect(secondTag.locator('[data-selected="true"]')).toBeVisible();
    });
  });

  test.describe('Integration Tests', () => {
    test('should clear tag selection with Ctrl+K', async ({ page }) => {
      // Select a tag
      await page.locator('[data-testid^="tag-"]').first().click();
      
      // Verify selection
      await expect(page.locator('[data-selected="true"]')).toHaveCount(1);
      
      // Clear filters
      await page.keyboard.press('Control+k');
      
      // No tags should be selected
      await expect(page.locator('[data-selected="true"]')).toHaveCount(0);
    });

    test('should not trigger card edit when exiting tag mode', async ({ page }) => {
      // Focus a card
      const firstCard = page.locator('[data-testid^="card-"]').first();
      await firstCard.click();
      await expect(firstCard).toHaveAttribute('data-focused', 'true');
      
      // Enter and exit tag mode
      await page.keyboard.press('#');
      await page.keyboard.press('Enter');
      
      // Card should not be editing
      await expect(firstCard).toHaveAttribute('data-editing', 'false');
    });

    test('should create cards with selected tags pre-filled', async ({ page }) => {
      // Select a tag
      const firstTag = page.locator('[data-testid^="tag-"]').first();
      await firstTag.click();
      
      // Create new card
      const addButtons = page.locator('text=+');
      await addButtons.first().click();
      
      // Check card content
      const newCard = page.locator('[data-editing="true"] textarea');
      await expect(newCard).toBeVisible();
      
      const content = await newCard.inputValue();
      expect(content).toMatch(/^.+#\w+/); // Should start with newline followed by tag
      
      // Cursor should be at start
      const selectionStart = await newCard.evaluate((el: HTMLTextAreaElement) => el.selectionStart);
      expect(selectionStart).toBe(0);
    });
  });
});