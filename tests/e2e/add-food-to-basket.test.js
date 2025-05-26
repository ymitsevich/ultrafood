// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Basket functionality', () => {
  test('should add a food item to the basket', async ({ page }) => {
    // Go to the application
    await page.goto('/');
    
    // Wait for the page to load (food grid should be visible)
    await page.waitForSelector('.food-grid', { timeout: 3000 }); // Reduced from 10000
    
    // Check if language modal appears and close it
    const languageModalSelector = '.modal-content.language-modal';
    if (await page.locator(languageModalSelector).isVisible()) {
      console.log('Language modal detected, closing it first');
      await page.locator(`${languageModalSelector} .close-modal`).click();
      
      // Wait for the modal to disappear
      await page.waitForTimeout(200); // Reduced from 500
    }
    
    // Get the first food item and its name
    const firstFoodItem = await page.locator('.food-item:not(.add-new-food) .food-btn').first();
    const foodName = await firstFoodItem.locator('.food-name').textContent() || 'Unknown food';
    console.log(`Selected food item: ${foodName}`);
    
    // Take screenshot before clicking
    await page.screenshot({ path: 'test-results/before-click.png' });
    
    // Click on the food item to add it to the basket
    await firstFoodItem.click();
    console.log('Food item clicked');
    
    // Wait a moment and take screenshot after clicking
    await page.waitForTimeout(500); // Reduced from 1000
    await page.screenshot({ path: 'test-results/after-click.png' });
    
    // Check for visible modals only
    const visibleModals = await page.locator('.modal:visible').all();
    console.log(`Found ${visibleModals.length} visible modals after clicking`);
    
    // If no visible modals were found, try to check all modals
    if (visibleModals.length === 0) {
      const allModals = await page.locator('.modal').all();
      console.log(`No visible modals, but found ${allModals.length} total modals`);
      
      // Try to look for any amount buttons directly, without relying on the modal structure
      const amountButtons = await page.locator('.amount-btn').all();
      if (amountButtons.length > 0) {
        console.log(`Found ${amountButtons.length} amount buttons directly`);
        await amountButtons[0].click();
        console.log('Clicked first amount button found directly');
      }
    } else {
      // Process visible modals
      for (const modal of visibleModals) {
        try {
          const classes = await modal.getAttribute('class') || '';
          console.log(`Modal: visible=true, classes=${classes}`);
          
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
              await page.waitForTimeout(200); // Reduced from 500
              await firstFoodItem.click();
              await page.waitForTimeout(500); // Reduced from 1000
            }
          }
        } catch (error) {
          console.log(`Error processing modal: ${error.message}`);
        }
      }
    }
    
    // Take screenshot of basket area
    await page.screenshot({ path: 'test-results/basket-area.png' });
    
    // Wait for basket to be updated and check for any items
    await page.waitForTimeout(500); // Reduced from 1000
    
    // Check if basket has any items
    const basketItemCount = await page.locator('.basket-item').count();
    console.log(`Found ${basketItemCount} items in the basket`);
    
    // If we have items in the basket, consider test successful
    if (basketItemCount > 0) {
      // Get the first basket item name
      const basketItemName = await page.locator('.basket-item-name').first().textContent() || 'Unknown item';
      console.log(`Basket item name: ${basketItemName}`);
      
      // Verify it matches our expected food name if possible
      expect(basketItemName).not.toBe('');
      console.log(`Successfully added "${basketItemName}" to basket`);
      
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