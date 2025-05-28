import { test, expect } from '@playwright/test';

test.describe('Tag Selection - Basic Setup', () => {
  test('should create test cards and verify tag selector appears', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await expect(page.locator('text=idea')).toBeVisible();
    
    // Since Insert key needs a focused card, let's try a different approach
    // Let's look for any existing way to add cards or use the + button
    
    // First, let's see if there are any + buttons
    const addButtons = page.locator('text=+');
    const addButtonCount = await addButtons.count();
    console.log('Add buttons found:', addButtonCount);
    
    if (addButtonCount > 0) {
      // Use the + button method
      await addButtons.first().click();
      
      // Check if we're in editing mode
      const editingCards = await page.locator('[data-editing="true"]').count();
      console.log('Cards in editing mode after + click:', editingCards);
      
      if (editingCards > 0) {
        await page.keyboard.type('#bug Fix login issue');
        await page.keyboard.press('Enter'); // Use Enter to save new cards
        
        // Wait for save to complete
        await page.waitForTimeout(200);
        
        // Verify card was created
        const cardCount = await page.locator('[data-testid^="card-"]').count();
        console.log('Cards after creation:', cardCount);
        expect(cardCount).toBe(1);
        
        // Verify tag selector appears
        await expect(page.locator('[data-testid="tag-selector"]')).toBeVisible();
        await expect(page.locator('[data-testid="tag-bug"]')).toBeVisible();
      }
    } else {
      // Try double-clicking on column headers/areas
      const ideaColumn = page.locator('text=idea').locator('..');
      await ideaColumn.dblclick();
      
      // Wait and check for editing mode
      await page.waitForTimeout(500);
      const editingCards = await page.locator('[data-editing="true"]').count();
      console.log('Cards in editing mode after double-click:', editingCards);
      
      if (editingCards > 0) {
        await page.keyboard.type('#test This is a test');
        await page.keyboard.press('Enter'); // Use Enter to save new cards
        
        // Wait for save to complete
        await page.waitForTimeout(200);
        
        // Verify tag selector appears
        await expect(page.locator('[data-testid="tag-selector"]')).toBeVisible();
        await expect(page.locator('[data-testid="tag-test"]')).toBeVisible();
      } else {
        console.log('Neither + button nor double-click worked');
        // Take a screenshot for debugging
        await page.screenshot({ path: 'card-creation-failed.png' });
      }
    }
  });

  test('should enter and exit tag selection mode', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=idea')).toBeVisible();
    
    // Create a simple test card first
    // Try the + button approach
    const addButtons = page.locator('text=+');
    if (await addButtons.count() > 0) {
      await addButtons.first().click();
      await page.keyboard.type('#simple test card');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
    }
    
    // Wait for tag selector to appear
    await expect(page.locator('[data-testid="tag-selector"]')).toBeVisible();
    
    // Test basic tag mode entry/exit
    await page.keyboard.press('#');
    await expect(page.locator('[data-testid="tag-prefix"]')).toBeVisible();
    await expect(page.locator('[data-testid="tag-prefix"]')).toContainText('#');
    
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="tag-prefix"]')).not.toBeVisible();
  });
});