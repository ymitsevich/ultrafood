// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Amount Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ultrafood/');
    
    // Close any open modals first (like language modal)
    const modals = await page.locator('.modal:visible').all();
    for (const modal of modals) {
      const closeButton = modal.locator('.close-modal');
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(200);
      }
    }
  });

  test('Should interact with amount modal', async ({ page }) => {
    console.log('Testing amount modal interactions');
    
    // Switch to a tag with food items
    const tagButtons = page.locator('button.tag-btn').filter({ hasText: /^(Fruits|Meat|Grains|Vegetables)$/ });
    if (await tagButtons.count() > 0) {
      await tagButtons.first().click();
      await page.waitForTimeout(1000);
    }
    
    // Find a food item to click
    const foodItems = page.locator('.food-item:not(.add-new-food) .food-btn');
    if (await foodItems.count() > 0) {
      console.log('Found food items, clicking first one');
      
      const firstFood = foodItems.first();
      await firstFood.click();
      
      // Wait for amount modal to appear (use more specific selector)
      const amountModal = page.locator('.modal:visible').first();
      await expect(amountModal).toBeVisible({ timeout: 3000 });
      console.log('✓ Amount modal opened');
      
      // Check if modal content is visible
      const modalContent = amountModal.locator('.modal-content');
      await expect(modalContent).toBeVisible();
      
      // Test preset amount buttons
      const amountButtons = amountModal.locator('.amount-btn');
      const buttonCount = await amountButtons.count();
      console.log(`Found ${buttonCount} preset amount buttons`);
      
      if (buttonCount > 0) {
        // Test clicking a preset amount button
        const firstAmountBtn = amountButtons.first();
        const buttonText = await firstAmountBtn.textContent();
        console.log(`Testing preset amount button: ${buttonText}`);
        
        await firstAmountBtn.click();
        console.log('✓ Preset amount button clicked');
        
        // Wait for modal to close
        await page.waitForSelector('.modal:visible', { state: 'hidden', timeout: 3000 });
        
        // Re-open modal for custom amount test
        await firstFood.click();
        const reopenedModal = page.locator('.modal:visible').first();
        await expect(reopenedModal).toBeVisible({ timeout: 3000 });
      }
      
      // Test custom amount input (use the current modal)
      const currentModal = page.locator('.modal:visible').first();
      const customAmountInput = currentModal.locator('.custom-amount input');
      if (await customAmountInput.isVisible()) {
        console.log('Testing custom amount input');
        
        await customAmountInput.fill('125g');
        console.log('✓ Custom amount entered');
        
        // Click the custom amount button
        const customAmountBtn = currentModal.locator('.custom-amount-btn');
        await customAmountBtn.click();
        console.log('✓ Custom amount button clicked');
        
        // Wait for modal to close
        await page.waitForSelector('.modal:visible', { state: 'hidden', timeout: 3000 });
      }
      
      // Test modal close button
      await firstFood.click();
      const finalModal = page.locator('.modal:visible').first();
      await expect(finalModal).toBeVisible({ timeout: 3000 });
      
      const closeButton = finalModal.locator('.close-modal');
      if (await closeButton.isVisible()) {
        await closeButton.click();
        console.log('✓ Modal closed via close button');
        
        // Wait for modal to be hidden
        await page.waitForSelector('.modal:visible', { state: 'hidden', timeout: 3000 });
      }
      
    } else {
      console.log('No food items found, creating a test food first');
      
      // Create a test food item
      const addFoodButton = page.locator('.add-new-food .add-food-btn');
      if (await addFoodButton.isVisible()) {
        await addFoodButton.click();
        await page.waitForTimeout(500);
        
        await page.waitForSelector('.modal:visible', { timeout: 3000 });
        
        await page.fill('input[id="food-name"]', 'Test Amount Modal Food');
        
        // Add tag
        const tagInput = page.locator('.inline-tag-input input');
        await tagInput.fill('test');
        await tagInput.press('Enter');
        
        // Submit
        const submitButton = page.locator('button:has-text("Add Food")');
        await submitButton.click();
        
        await page.waitForSelector('.modal', { state: 'hidden', timeout: 5000 });
        await page.waitForTimeout(1000);
        
        // Switch to test tag and test the created food
        const testTag = page.locator('button.tag-btn:has-text("test")');
        if (await testTag.isVisible()) {
          await testTag.click();
          await page.waitForTimeout(500);
          
          const newFood = page.locator('.food-item:not(.add-new-food) .food-btn').first();
          await newFood.click();
          
          await page.waitForSelector('.modal:visible', { timeout: 3000 });
          
          // Test the amount modal with created food
          const amountBtn = page.locator('.amount-btn').first();
          if (await amountBtn.isVisible()) {
            await amountBtn.click();
            console.log('✓ Amount modal tested with created food');
          }
        }
      }
    }
  });
});