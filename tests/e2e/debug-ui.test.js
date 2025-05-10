// @ts-check
import { test, expect } from '@playwright/test';

// Debug test to examine the UI behavior
test('Debug UI elements and interactions', async ({ page }) => {
  // Navigate to the app
  await page.goto('/');
  
  // Wait for the food grid to load
  await page.waitForSelector('.food-grid', { timeout: 10000 });
  
  // Log page title and URL to confirm we're on the right page
  console.log('Page title:', await page.title());
  console.log('Page URL:', page.url());
  
  // Count how many food items are present
  const foodItems = await page.locator('.food-item:not(.add-new-food)').count();
  console.log(`Found ${foodItems} food items on the page`);
  
  if (foodItems > 0) {
    // Get the first food item and print its name
    const firstItem = page.locator('.food-item:not(.add-new-food)').first();
    const foodName = await firstItem.locator('.food-name').textContent();
    console.log(`First food item name: ${foodName}`);
    
    // Get the button within the food item
    const foodButton = firstItem.locator('.food-btn');
    console.log('Food button found, attempting to click it...');
    
    // Click the food button specifically
    await foodButton.click();
    console.log('Food button clicked');
    
    // Wait to see if any modal appears
    await page.waitForTimeout(2000);
    console.log('Waited 2 seconds after click');
    
    // Check DOM for modals
    const modalCount = await page.locator('.modal').count();
    console.log(`Found ${modalCount} modals in the DOM`);
    
    // Check if any of the modals are visible
    for (let i = 0; i < modalCount; i++) {
      const modal = page.locator('.modal').nth(i);
      const isVisible = await modal.isVisible();
      const display = await modal.evaluate(el => window.getComputedStyle(el).display);
      console.log(`Modal #${i}: visible=${isVisible}, display=${display}`);
      
      // Dump the HTML of each modal to see its structure
      const html = await modal.evaluate(el => el.outerHTML);
      console.log(`Modal #${i} HTML: ${html.substring(0, 100)}...`);
    }
    
    // Check for amount buttons in the DOM regardless of visibility
    const amountButtons = await page.locator('.amount-btn').count();
    console.log(`Found ${amountButtons} amount buttons in the DOM`);
    
    // Check for all active modals (might be using a different display mechanism)
    const activeModals = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const visibleModals = [];
      
      for (const el of allElements) {
        if (window.getComputedStyle(el).display !== 'none' && 
            (el.classList.contains('modal') || 
             el.classList.contains('modal-content'))) {
          visibleModals.push({
            tagName: el.tagName,
            className: el.className,
            display: window.getComputedStyle(el).display
          });
        }
      }
      
      return visibleModals;
    });
    
    console.log('Active modals found:', activeModals);
  }
});