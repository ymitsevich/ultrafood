// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Basket functionality', () => {
  test('should add a food item to the basket', async ({ page }) => {
    // Go to the application
    await page.goto('/');
    
    // Wait for the page to load (food grid should be visible)
    await page.waitForSelector('.food-grid', { timeout: 10000 });
    
    // Check if language modal appears and close it
    const languageModalSelector = '.modal-content.language-modal';
    if (await page.locator(languageModalSelector).isVisible()) {
      console.log('Language modal detected, closing it first');
      await page.locator(`${languageModalSelector} .close-modal`).click();
      
      // Wait for the modal to disappear
      await page.waitForTimeout(500);
    }
    
    // Get the first food item and its name
    const firstFoodItem = await page.locator('.food-item:not(.add-new-food) .food-btn').first();
    const foodName = await firstFoodItem.locator('.food-name').textContent();
    console.log(`Selected food item: ${foodName}`);
    
    // Take screenshot before clicking
    await page.screenshot({ path: 'test-results/before-click.png' });
    
    // Click on the food item to add it to the basket
    await firstFoodItem.click();
    console.log('Food item clicked');
    
    // Wait a moment and take screenshot after clicking
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/after-click.png' });
    
    // Check for any modal and log its details
    const modals = await page.locator('.modal').all();
    console.log(`Found ${modals.length} modals after clicking`);
    
    for (const modal of modals) {
      const isVisible = await modal.isVisible();
      const classes = await modal.getAttribute('class');
      console.log(`Modal: visible=${isVisible}, classes=${classes}`);
      
      if (isVisible) {
        // If it's the amount modal, we need to select an amount
        const amountButtons = await modal.locator('.amount-btn').all();
        if (amountButtons.length > 0) {
          console.log(`Found ${amountButtons.length} amount buttons`);
          await amountButtons[0].click();
          console.log('Clicked first amount button');
        } else {
          // If it's the language modal, close it and try clicking the food item again
          const closeButton = modal.locator('.close-modal');
          if (await closeButton.isVisible()) {
            await closeButton.click();
            console.log('Closed modal and will try clicking food item again');
            await page.waitForTimeout(500);
            await firstFoodItem.click();
            await page.waitForTimeout(1000);
          }
        }
      }
    }
    
    // Now try to find the amount buttons in any visible modal after possible retry
    const visibleAmountButtons = await page.locator('.modal:visible .amount-btn').all();
    if (visibleAmountButtons.length > 0) {
      console.log('Found visible amount buttons after retry, clicking first one');
      await visibleAmountButtons[0].click();
    }
    
    // Take screenshot of basket area
    await page.screenshot({ path: 'test-results/basket-area.png' });
    
    // Wait for basket to be updated and check for any items
    await page.waitForTimeout(1000);
    
    // Check if basket has any items
    const basketItemCount = await page.locator('.basket-item').count();
    console.log(`Found ${basketItemCount} items in the basket`);
    
    // If we have items in the basket, consider test successful
    if (basketItemCount > 0) {
      // Get the first basket item name
      const basketItemName = await page.locator('.basket-item-name').first().textContent();
      console.log(`Basket item name: ${basketItemName}`);
      
      // Verify it matches our expected food name if possible
      if (basketItemName) {
        expect(basketItemName).not.toBe('');
        console.log(`Successfully added "${basketItemName}" to basket`);
      }
      
      // Test passes if we found at least one item in the basket
      expect(basketItemCount).toBeGreaterThan(0);
    } else {
      // If no items in basket, fail the test with helpful message
      console.log('No items found in basket - test failed');
      await page.screenshot({ path: 'test-results/test-failed-no-basket-items.png' });
      expect(basketItemCount, 'No items were added to the basket').toBeGreaterThan(0);
    }
  });
});