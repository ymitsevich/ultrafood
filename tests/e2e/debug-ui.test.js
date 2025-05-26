// @ts-check
import { test, expect } from '@playwright/test';

// Debug environment information
console.log('----------------------------------------');
console.log('Environment Debug Information:');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`Environment: ${process.env.NODE_ENV === 'production' ? 'prod' : (process.env.NODE_ENV === 'development' ? 'dev' : 'test')}`);

// Check for .env variables to determine which file is loaded
// This assumes your .env and .env.test files have some distinct variables or values
console.log('\nEnvironment file detection:');
// List some key environment variables that might help identify which file is loaded
console.log('ENV_FILE:', process.env.ENV_FILE || 'not specified');
// You can add more env vars to check as needed
console.log('Using file:', process.env.ENV_FILE ? (process.env.ENV_FILE.includes('test') ? '.env.test' : '.env') : 'Unable to determine');
console.log('----------------------------------------');

// Debug test to examine the UI behavior
test('Debug UI elements and interactions', async ({ page }) => {
  // Navigate to the app
  await page.goto('/');
  
  // Wait for the food grid to load
  await page.waitForSelector('.food-grid', { timeout: 3000 }); // Reduced from 10000
  
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
    await page.waitForTimeout(1000); // Reduced from 2000
    console.log('Waited 1 second after click');
    
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