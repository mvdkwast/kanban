import { test, expect } from '@playwright/test';

test.describe('Tag Selection System - Comprehensive', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await expect(page.locator('text=idea')).toBeVisible();
    
    // Create comprehensive test data covering edge cases
    const testCards = [
      { content: '#bug #urgent Fix login crash', column: 'todo' },
      { content: '#bug Minor UI glitch', column: 'idea' },
      { content: '#feature #ui Add dark mode', column: 'doing' },
      { content: '#feature Backend optimization', column: 'todo' },
      { content: '#docs Update README', column: 'done' },
      { content: 'No tags here', column: 'idea' },
      { content: '#a #b #c Multiple short tags', column: 'todo' },
      { content: '#verylongtag This has a very long tag name', column: 'idea' }
    ];
    
    // Create cards using + buttons (more reliable than double-click)
    for (const card of testCards) {
      // Find add button for the target column and click it
      const addButtons = page.locator('text=+');
      if (await addButtons.count() > 0) {
        // Click the first + button and create card there
        // (Note: this is simplified - in a real test we'd target specific columns)
        await addButtons.first().click();
        
        // Wait for editing mode
        await expect(page.locator('[data-editing="true"]')).toBeVisible();
        
        // Type content and save with Enter (not Escape for new cards)
        await page.keyboard.type(card.content);
        await page.keyboard.press('Enter');
        
        // Wait for save to complete
        await page.waitForTimeout(300);
      }
    }
    
    // Wait for tag selector to appear
    await expect(page.locator('[data-testid="tag-selector"]')).toBeVisible();
  });

  test.describe('Manual Mode (prefix = "#")', () => {
    test('should enter manual mode and show all tags', async ({ page }) => {
      await page.keyboard.press('#');
      
      // Should show prefix
      await expect(page.locator('[data-testid="tag-prefix"]')).toContainText('#');
      
      // All tags should be visible and none darkened
      await expect(page.locator('[data-testid="tag-bug"][data-darkened="false"]')).toBeVisible();
      await expect(page.locator('[data-testid="tag-feature"][data-darkened="false"]')).toBeVisible();
      await expect(page.locator('[data-testid="tag-urgent"][data-darkened="false"]')).toBeVisible();
      await expect(page.locator('[data-testid="tag-ui"][data-darkened="false"]')).toBeVisible();
      await expect(page.locator('[data-testid="tag-docs"][data-darkened="false"]')).toBeVisible();
      
      // One tag should be focused (in tag selector)
      await expect(page.locator('[data-testid^="tag-"][data-focused="true"]')).toHaveCount(1);
    });

    test('should use selection for active filtering in manual mode', async ({ page }) => {
      await page.keyboard.press('#');
      await page.keyboard.press(' '); // Select first tag
      
      // Active filtering should match selection (first tag, likely #a, #b, #bug, #docs, #feature, #ui, #urgent, #verylongtag alphabetically)
      // Let's check which tag is first
      const focusedTag = await page.locator('[data-testid^="tag-"][data-focused="true"]').getAttribute('data-tag');
      
      // Cards should be filtered based on selected tag
      const filteredCards = page.locator('[data-testid^="card-"]');
      const cardCount = await filteredCards.count();
      
      // Should have at least 1 card (the one with the selected tag)
      expect(cardCount).toBeGreaterThan(0);
      
      // Verify the tag is selected
      await expect(page.locator(`[data-tag="${focusedTag}"][data-selected="true"]`)).toBeVisible();
    });

    test('should handle Enter key in manual mode', async ({ page }) => {
      await page.keyboard.press('#');
      
      // Navigate to a specific tag
      const targetTag = page.locator('[data-testid="tag-bug"]');
      await targetTag.click();
      await page.keyboard.press('#'); // Re-enter tag mode after click
      
      // Move focus to #bug tag if not already focused
      let attempts = 0;
      while (!(await page.locator('[data-testid="tag-bug"][data-focused="true"]').isVisible()) && attempts < 10) {
        await page.keyboard.press('ArrowRight');
        attempts++;
      }
      
      // Verify we found the tag
      await expect(page.locator('[data-testid="tag-bug"][data-focused="true"]')).toBeVisible();
      
      await page.keyboard.press('Enter');
      
      // Should exit tag mode
      await expect(page.locator('[data-testid="tag-prefix"]')).not.toBeVisible();
      
      // Should select only the focused tag
      await expect(page.locator('[data-testid="tag-bug"][data-selected="true"]')).toBeVisible();
      
      // Should focus a card
      await expect(page.locator('[data-testid^="card-"][data-focused="true"]')).toBeVisible();
    });

    test('should handle Shift+Enter in manual mode', async ({ page }) => {
      // First select a tag through clicking
      await page.locator('[data-testid="tag-feature"]').click();
      
      // Enter tag mode and select another tag with Shift+Enter
      await page.keyboard.press('#');
      
      // Navigate to #bug tag (with safety limit)
      let attempts = 0;
      while (!(await page.locator('[data-testid="tag-bug"][data-focused="true"]').isVisible()) && attempts < 10) {
        await page.keyboard.press('ArrowRight');
        attempts++;
      }
      
      // Verify we found the tag
      await expect(page.locator('[data-testid="tag-bug"][data-focused="true"]')).toBeVisible();
      
      await page.keyboard.press('Shift+Enter');
      
      // Should exit tag mode
      await expect(page.locator('[data-testid="tag-prefix"]')).not.toBeVisible();
      
      // Should have both tags selected
      await expect(page.locator('[data-testid="tag-feature"][data-selected="true"]')).toBeVisible();
      await expect(page.locator('[data-testid="tag-bug"][data-selected="true"]')).toBeVisible();
    });

    test('should handle Space key in manual mode', async ({ page }) => {
      await page.keyboard.press('#');
      
      // Navigate to #bug tag and press space
      let attempts = 0;
      while (!(await page.locator('[data-testid="tag-bug"][data-focused="true"]').isVisible()) && attempts < 10) {
        await page.keyboard.press('ArrowRight');
        attempts++;
      }
      
      // Verify we found the tag
      await expect(page.locator('[data-testid="tag-bug"][data-focused="true"]')).toBeVisible();
      
      await page.keyboard.press(' ');
      
      // Should stay in tag mode
      await expect(page.locator('[data-testid="tag-prefix"]')).toBeVisible();
      
      // Should select only the focused tag (clearing others)
      await expect(page.locator('[data-testid="tag-bug"][data-selected="true"]')).toBeVisible();
      
      // Navigate to another tag and press space again
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press(' ');
      
      // Previous tag should be deselected, new one selected
      await expect(page.locator('[data-testid="tag-bug"][data-selected="false"]')).toBeVisible();
    });

    test('should handle Shift+Space in manual mode', async ({ page }) => {
      await page.keyboard.press('#');
      
      // Select first tag with space
      await page.keyboard.press(' ');
      
      // Navigate to another tag and use Shift+Space
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Shift+ ');
      
      // Should stay in tag mode
      await expect(page.locator('[data-testid="tag-prefix"]')).toBeVisible();
      
      // Both tags should be selected
      const selectedTags = page.locator('[data-selected="true"]');
      await expect(selectedTags).toHaveCount(2);
    });
  });

  test.describe('Preview Mode (prefix > "#")', () => {
    test('should enter preview mode when typing after #', async ({ page }) => {
      await page.keyboard.press('#');
      await page.keyboard.type('bu');
      
      // Should show longer prefix
      await expect(page.locator('[data-testid="tag-prefix"]')).toContainText('#bu');
      
      // Only matching tags should be reachable (not darkened)
      await expect(page.locator('[data-testid="tag-bug"][data-darkened="false"]')).toBeVisible();
      
      // Non-matching tags should be darkened
      await expect(page.locator('[data-testid="tag-feature"][data-darkened="true"]')).toBeVisible();
      await expect(page.locator('[data-testid="tag-docs"][data-darkened="true"]')).toBeVisible();
      
      // Focused tag should have glow effect
      await expect(page.locator('[data-testid="tag-bug"][data-glowing="true"]')).toBeVisible();
    });

    test('should use focused tag for active filtering in preview mode', async ({ page }) => {
      await page.keyboard.press('#');
      await page.keyboard.type('bug');
      
      // Should filter cards based on focused tag (#bug), not selection
      const visibleCards = page.locator('[data-testid^="card-"]');
      const cardCount = await visibleCards.count();
      
      // Should show only cards with #bug tag (2 in our test data)
      expect(cardCount).toBe(2);
    });

    test('should handle Enter in preview mode', async ({ page }) => {
      await page.keyboard.press('#');
      await page.keyboard.type('feat');
      await page.keyboard.press('Enter');
      
      // Should exit tag mode
      await expect(page.locator('[data-testid="tag-prefix"]')).not.toBeVisible();
      
      // Should select the focused tag
      await expect(page.locator('[data-testid="tag-feature"][data-selected="true"]')).toBeVisible();
      
      // Should focus a card
      await expect(page.locator('[data-testid^="card-"][data-focused="true"]')).toBeVisible();
    });

    test('should handle Shift+Enter in preview mode', async ({ page }) => {
      // Pre-select a tag
      await page.locator('[data-testid="tag-docs"]').click();
      
      // Enter preview mode
      await page.keyboard.press('#');
      await page.keyboard.type('bug');
      await page.keyboard.press('Shift+Enter');
      
      // Should exit tag mode
      await expect(page.locator('[data-testid="tag-prefix"]')).not.toBeVisible();
      
      // Should have both the saved selection and the focused tag
      await expect(page.locator('[data-testid="tag-docs"][data-selected="true"]')).toBeVisible();
      await expect(page.locator('[data-testid="tag-bug"][data-selected="true"]')).toBeVisible();
    });

    test('should handle Space in preview mode', async ({ page }) => {
      await page.keyboard.press('#');
      await page.keyboard.type('feat');
      await page.keyboard.press(' ');
      
      // Should reset prefix to # (back to manual mode)
      await expect(page.locator('[data-testid="tag-prefix"]')).toContainText('#');
      
      // Should stay in tag mode
      await expect(page.locator('[data-testid="tag-prefix"]')).toBeVisible();
      
      // Should select only the focused tag
      await expect(page.locator('[data-testid="tag-feature"][data-selected="true"]')).toBeVisible();
    });

    test('should handle Shift+Space in preview mode', async ({ page }) => {
      // Pre-select a tag
      await page.locator('[data-testid="tag-docs"]').click();
      
      // Enter preview mode
      await page.keyboard.press('#');
      await page.keyboard.type('urgent');
      await page.keyboard.press('Shift+ ');
      
      // Should stay in tag mode but remain in preview mode
      await expect(page.locator('[data-testid="tag-prefix"]')).toContainText('#urgent');
      
      // Should have both saved selection and focused tag
      await expect(page.locator('[data-testid="tag-docs"][data-selected="true"]')).toBeVisible();
      await expect(page.locator('[data-testid="tag-urgent"][data-selected="true"]')).toBeVisible();
    });
  });

  test.describe('Navigation and Focus', () => {
    test('should navigate with arrow keys only between non-darkened tags', async ({ page }) => {
      await page.keyboard.press('#');
      await page.keyboard.type('b'); // Matches #bug and #b
      
      // Should be able to navigate between matching tags
      const initialFocused = await page.locator('[data-testid^="tag-"][data-focused="true"]').getAttribute('data-tag');
      
      await page.keyboard.press('ArrowRight');
      const afterRight = await page.locator('[data-testid^="tag-"][data-focused="true"]').getAttribute('data-tag');
      
      // Focus should have changed to another matching tag
      expect(afterRight).not.toBe(initialFocused);
      
      // Focus should only be on non-darkened tags
      await expect(page.locator('[data-testid^="tag-"][data-focused="true"][data-darkened="false"]')).toBeVisible();
    });

    test('should restore focus when entering tag mode', async ({ page }) => {
      // Click on a specific tag to set last focused
      await page.locator('[data-testid="tag-feature"]').click();
      
      // Enter tag mode
      await page.keyboard.press('#');
      
      // Should restore focus to the last focused tag
      await expect(page.locator('[data-testid="tag-feature"][data-focused="true"]')).toBeVisible();
    });

    test('should hide focus indicator when exiting tag mode', async ({ page }) => {
      await page.keyboard.press('#');
      await page.keyboard.press('Escape');
      
      // No tag should have focus indicator
      await expect(page.locator('[data-testid^="tag-"][data-focused="true"]')).toHaveCount(0);
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle no matching tags', async ({ page }) => {
      await page.keyboard.press('#');
      await page.keyboard.type('xyz'); // No matching tags
      
      // Prefix should turn red
      await expect(page.locator('[data-testid="tag-prefix"] span')).toHaveClass(/text-red-400/);
      
      // All tags should be darkened
      await expect(page.locator('[data-darkened="false"]')).toHaveCount(0);
      
      // No tag should be focused
      await expect(page.locator('[data-testid^="tag-"][data-focused="true"]')).toHaveCount(0);
    });

    test('should exit tag mode when backspacing at #', async ({ page }) => {
      await page.keyboard.press('#');
      await page.keyboard.press('Backspace');
      
      // Should exit tag mode
      await expect(page.locator('[data-testid="tag-prefix"]')).not.toBeVisible();
    });

    test('should handle double escape from preview mode', async ({ page }) => {
      // Pre-select tags
      await page.locator('[data-testid="tag-docs"]').click();
      await page.locator('[data-testid="tag-urgent"]').click({ modifiers: ['Shift'] });
      
      // Enter preview mode
      await page.keyboard.press('#');
      await page.keyboard.type('bug');
      
      // First escape should return to manual mode
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-testid="tag-prefix"]')).toContainText('#');
      
      // Second escape should exit and restore saved selection
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-testid="tag-prefix"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="tag-docs"][data-selected="true"]')).toBeVisible();
      await expect(page.locator('[data-testid="tag-urgent"][data-selected="true"]')).toBeVisible();
    });
  });

  test.describe('Click Interactions', () => {
    test('should handle regular click semantics', async ({ page }) => {
      // Select multiple tags first
      await page.locator('[data-testid="tag-bug"]').click();
      await page.locator('[data-testid="tag-feature"]').click({ modifiers: ['Shift'] });
      
      // Click on an unselected tag
      await page.locator('[data-testid="tag-docs"]').click();
      
      // Should clear selection and toggle clicked tag
      await expect(page.locator('[data-testid="tag-bug"][data-selected="false"]')).toBeVisible();
      await expect(page.locator('[data-testid="tag-feature"][data-selected="false"]')).toBeVisible();
      await expect(page.locator('[data-testid="tag-docs"][data-selected="true"]')).toBeVisible();
      
      // Click on the selected tag - should deselect it
      await page.locator('[data-testid="tag-docs"]').click();
      await expect(page.locator('[data-testid="tag-docs"][data-selected="false"]')).toBeVisible();
    });

    test('should handle shift+click semantics', async ({ page }) => {
      // Select a tag
      await page.locator('[data-testid="tag-bug"]').click();
      
      // Shift+click another tag
      await page.locator('[data-testid="tag-feature"]').click({ modifiers: ['Shift'] });
      
      // Both should be selected
      await expect(page.locator('[data-testid="tag-bug"][data-selected="true"]')).toBeVisible();
      await expect(page.locator('[data-testid="tag-feature"][data-selected="true"]')).toBeVisible();
      
      // Shift+click the first tag again
      await page.locator('[data-testid="tag-bug"]').click({ modifiers: ['Shift'] });
      
      // Should deselect only that tag
      await expect(page.locator('[data-testid="tag-bug"][data-selected="false"]')).toBeVisible();
      await expect(page.locator('[data-testid="tag-feature"][data-selected="true"]')).toBeVisible();
    });

    test('should focus card after tag selection', async ({ page }) => {
      await page.locator('[data-testid="tag-bug"]').click();
      
      // Should focus a card after selection
      await expect(page.locator('[data-testid^="card-"][data-focused="true"]')).toBeVisible();
    });
  });

  test.describe('Integration with Card Management', () => {
    test('should clear tag selection with Ctrl+K', async ({ page }) => {
      // Select tags
      await page.locator('[data-testid="tag-bug"]').click();
      await page.locator('[data-testid="tag-feature"]').click({ modifiers: ['Shift'] });
      
      // Clear filters
      await page.keyboard.press('Control+k');
      
      // Tags should be deselected
      await expect(page.locator('[data-selected="true"]')).toHaveCount(0);
      
      // All cards should be visible
      const allCards = page.locator('[data-testid^="card-"]');
      await expect(allCards).toHaveCount(8); // All our test cards
    });

    test('should create cards with selected tags pre-filled', async ({ page }) => {
      // Select tags
      await page.locator('[data-testid="tag-bug"]').click();
      
      // Create new card using + button
      const addButtons = page.locator('text=+');
      await addButtons.first().click();
      
      // New card should have tags pre-filled
      const newCard = page.locator('[data-editing="true"] textarea');
      await expect(newCard).toBeVisible();
      
      const content = await newCard.inputValue();
      expect(content).toMatch(/\n#bug/);
      
      // Cursor should be at start
      const selectionStart = await newCard.evaluate((el: HTMLTextAreaElement) => el.selectionStart);
      expect(selectionStart).toBe(0);
    });

    test('should not trigger card edit when exiting tag mode with Enter', async ({ page }) => {
      // Focus a card by clicking it
      const firstCard = page.locator('[data-testid^="card-"]').first();
      await firstCard.click();
      await expect(firstCard).toHaveAttribute('data-focused', 'true');
      
      // Enter tag mode and exit with Enter
      await page.keyboard.press('#');
      await page.keyboard.press('Enter');
      
      // Card should not be in edit mode
      await expect(firstCard).toHaveAttribute('data-editing', 'false');
    });
  });
});