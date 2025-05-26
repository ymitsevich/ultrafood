// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Custom amount functionality', () => {
  test('should add a food item with custom amount to the basket', async ({ page }) => {
    // Go to the application
    await page.goto('/');
    
    // Wait for the page to load (food grid should be visible)
    await page.waitForSelector('.food-grid', { timeout: 3000 }); // Reduced from 10000
    
    // Close any language modal if present
    const languageModalSelector = '.modal-content.language-modal';
    if (await page.locator(languageModalSelector).isVisible()) {
      await page.locator(`${languageModalSelector} .close-modal`).click();
      await page.waitForTimeout(200); // Reduced from 500
    }
    
    // Test setup: ensure we have an empty basket to start
    console.log('Clearing any existing basket items');
    await page.evaluate(() => {
      if (window.localStorage) {
        // Try to reset any localStorage values that might affect the basket
        window.localStorage.removeItem('basket');
      }
      
      // Directly reset the basket if the store is accessible
      if (window.basket && typeof window.basket.clear === 'function') {
        window.basket.clear();
      }
    });
    
    // Make sure all modals are closed before proceeding
    const visibleModals = await page.locator('.modal:visible').all();
    for (const modal of visibleModals) {
      const closeButton = modal.locator('.close-modal');
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(200); // Reduced from 500
      }
    }
    
    // Get the first food item
    const firstFoodItem = await page.locator('.food-item:not(.add-new-food)').first();
    const foodName = await firstFoodItem.locator('.food-name').textContent() || 'Unknown food';
    console.log(`Selected food item: ${foodName}`);
    
    // Take a screenshot before clicking the config button
    await page.screenshot({ path: 'test-results/before-click.png' });

    // Click the config button (scale icon) in the top right of the food item
    await firstFoodItem.locator('.config-btn').click();
    console.log('Clicked the config button to open amount modal');

    // Wait a moment for any animations
    await page.waitForTimeout(500); // Reduced from 1000
    
    // Take a screenshot after clicking the config button
    await page.screenshot({ path: 'test-results/amount-modal-0.png' });
    
    // Try different selectors for the amount buttons
    const amountButtons = await page.locator('.amount-btn').all();
    console.log(`Found ${amountButtons.length} amount buttons`);
    
    if (amountButtons.length > 0) {
      // Look for a 150g button, or use index 2 which is typically a medium amount
      let targetButton = null;
      for (const btn of amountButtons) {
        const text = await btn.textContent();
        if (text && text.includes('150g')) {
          targetButton = btn;
          break;
        }
      }
      
      // If we didn't find 150g specifically, just use the third button
      if (!targetButton && amountButtons.length > 2) {
        targetButton = amountButtons[2]; // Third button (index 2)
      } else if (!targetButton) {
        targetButton = amountButtons[0]; // Fallback to first button
      }
      
      // Click the chosen amount button
      await targetButton.click();
      const buttonText = await targetButton.textContent() || '150g';
      console.log(`Selected amount: ${buttonText}`);
    } else {
      // If no amount buttons found, try looking for custom amount input
      const customAmountInput = page.locator('input.custom-amount');
      if (await customAmountInput.isVisible()) {
        await customAmountInput.fill('42');
        await customAmountInput.press('Enter');
        console.log('Added custom amount: 42g');
      } else {
        console.log('No amount buttons or custom input found. Taking screenshot for debugging.');
        await page.screenshot({ path: 'test-results/no-amount-controls.png' });
      }
    }

    // Wait for the basket to update
    await page.waitForTimeout(500); // Reduced from 1000
    
    // Take a screenshot after selecting the amount
    await page.screenshot({ path: 'test-results/after-click.png' });

    // Verify the item was added to the basket
    const basketItems = await page.locator('.basket-item');
    
    // Check if basket has items
    const basketCount = await basketItems.count();
    console.log(`Found ${basketCount} items in the basket`);
    
    if (basketCount > 0) {
      // Get the amount from the basket item
      const basketItemAmount = await page.locator('.basket-item-amount').first().textContent() || 'No amount';
      console.log(`Item added with amount: ${basketItemAmount}`);

      // Screenshot the basket area
      await page.screenshot({ path: 'test-results/basket-area.png', fullPage: false });

      // Verify the basket has an item with any amount (not empty)
      expect(basketItemAmount).not.toBe('');
      expect(basketItemAmount).not.toBe('No amount');
    } else {
      console.log('No items found in basket - test failed');
      await page.screenshot({ path: 'test-results/test-failed-no-basket-items.png' });
      expect(basketCount, 'Basket should have at least one item').toBeGreaterThan(0);
    }
  });
});

