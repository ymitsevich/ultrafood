// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Custom amount functionality', () => {
  test('should add a food item with custom amount to the basket', async ({ page }) => {
    // Go to the application
    await page.goto('/');
    
    // Wait for the page to load (food grid should be visible)
    await page.waitForSelector('.food-grid', { timeout: 10000 });
    
    // Close any language modal if present
    const languageModalSelector = '.modal-content.language-modal';
    if (await page.locator(languageModalSelector).isVisible()) {
      await page.locator(`${languageModalSelector} .close-modal`).click();
      await page.waitForTimeout(500);
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
    
    // Get the first food item
    const firstFoodItem = await page.locator('.food-item:not(.add-new-food)').first();
    const foodName = await firstFoodItem.locator('.food-name').textContent();
    console.log(`Selected food item: ${foodName}`);
    
    // Take a screenshot before clicking the config button
    await page.screenshot({ path: 'test-results/before-click.png' });

    // Click the config button (scale icon) in the top right of the food item
    await firstFoodItem.locator('.config-btn').click();
    console.log('Clicked the config button to open amount modal');

    // Wait for the amount modal to appear
    await page.waitForSelector('.modal-content', { timeout: 5000 });

    // Take a screenshot after clicking the config button showing the amount modal
    await page.screenshot({ path: 'test-results/amount-modal.png' });

    // Select a custom amount - let's choose 150g
    await page.locator('.amount-btn:has-text("150g")').click();
    console.log('Selected custom amount: 150g');

    // Wait for the basket to update
    await page.waitForTimeout(1000);
    
    // Take a screenshot after selecting the amount
    await page.screenshot({ path: 'test-results/after-click.png' });

    // Verify the item was added to the basket with the custom amount
    const basketItem = await page.locator('.basket-item');
    
    // Check if basket has items
    expect(await basketItem.count(), 'Basket should have at least one item').toBeGreaterThan(0);

    // Get the amount from the basket item
    const basketItemAmount = await page.locator('.basket-item-amount').first().textContent();
    console.log(`Item added with amount: ${basketItemAmount}`);

    // Screenshot the basket area
    await page.screenshot({ path: 'test-results/basket-area.png', fullPage: false });

    // Verify the amount is what we selected (should be 150g)
    expect(basketItemAmount).toContain('150g');

    // Optional: Test if localStorage or basket shows the correct data
    const basketData = await page.evaluate(() => {
      // Check if we can get the basket data from various sources
      const result = {
        source: 'unknown',
        items: []
      };
      
      // Check if we can get data from the basket store
      if (window.basket && typeof window.basket.subscribe === 'function') {
        let basketItems = [];
        const unsubscribe = window.basket.subscribe(items => {
          basketItems = items;
        });
        unsubscribe();
        
        if (basketItems && basketItems.length > 0) {
          result.source = 'basket store';
          result.items = basketItems;
          return result;
        }
      }
      
      // Check if there's data in localStorage
      if (window.localStorage) {
        try {
          const basketJson = window.localStorage.getItem('basket');
          if (basketJson) {
            const parsedBasket = JSON.parse(basketJson);
            if (parsedBasket && parsedBasket.length > 0) {
              result.source = 'localStorage';
              result.items = parsedBasket;
              return result;
            }
          }
        } catch (e) {
          // Ignore localStorage errors
        }
      }
      
      return result;
    });
    
    console.log('Basket data from JavaScript:', basketData);

    // Verify the amount in the basket data
    if (basketData.items.length > 0) {
      expect(basketData.items[0].amount).toBe('150g');
    }
  });
});

