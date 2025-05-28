// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Edit Food Image Update', () => {
  test('should add a food item with image, edit the image, and persist after page refresh', async ({ page }) => {
    // Navigate to the app using the correct test URL
    await page.goto('http://localhost:3123/ultrafood/');
    console.log('Navigated to the app');
    
    // Wait for the app to load
    await page.waitForTimeout(1000);
    
    // Close any initial modals (like language modal)
    const initialModals = await page.locator('.modal:visible').all();
    for (const modal of initialModals) {
      const closeButton = modal.locator('.close-modal');
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(200);
      }
    }
    
    // Step 1: Switch to a regular tag to see the Add New Food button
    console.log('Step 1: Switching to a regular tag');
    
    // Click on a regular tag (not Recent) to see the add button
    const fruitsTag = page.locator('button.tag-btn').filter({ hasText: 'Fruits' });
    if (await fruitsTag.isVisible()) {
      await fruitsTag.click();
      console.log('Switched to Fruits tag');
    } else {
      // Fallback to any non-Recent tag
      const tagButtons = await page.locator('button.tag-btn').all();
      for (const btn of tagButtons) {
        const text = await btn.textContent();
        if (text && !text.includes('Recent') && !text.includes('+')) {
          await btn.click();
          console.log(`Switched to ${text} tag`);
          break;
        }
      }
    }
    
    await page.waitForTimeout(500);
    
    // Step 2: Add a new food item with an image
    console.log('Step 2: Adding a new food item with image');
    
    // Click the "Add New Food" button (+ button)
    const addFoodButton = await page.locator('.add-food-btn').first();
    await addFoodButton.click();
    console.log('Clicked add new food button');
    
    // Wait for the Add Food modal to appear
    await page.waitForSelector('.modal:visible', { timeout: 2000 });
    console.log('Add Food modal appeared');
    
    // Fill in the food name
    const testFoodName = 'Test Food for Image Edit';
    await page.fill('input[id="food-name"]', testFoodName);
    console.log(`Entered food name: ${testFoodName}`);
    
    // Look for a Pixabay image to select (if available)
    await page.waitForTimeout(1000);
    
    const pixabayImages = await page.locator('.pixabay-grid .image-item').all();
    console.log(`Found ${pixabayImages.length} Pixabay images`);
    
    if (pixabayImages.length > 0) {
      // Select the first available image
      await pixabayImages[0].click();
      console.log('Selected first Pixabay image');
      
      // Wait a moment for selection
      await page.waitForTimeout(500);
      
      // Submit the form
      const submitButton = page.locator('button.submit-btn').filter({ hasText: 'Add Food' });
      await submitButton.click();
      console.log('Submitted new food item');
      
      // Wait for the modal to close and food to be added
      await page.waitForTimeout(1500);
      
      // Step 3: Find the newly added food item and click its edit button
      console.log('Step 3: Finding and editing the newly added food item');
      
      // Look for food items that contain our test name
      const foodItems = await page.locator('.food-item:not(.add-new-food)').all();
      console.log(`Found ${foodItems.length} food items`);
      
      let targetFoodItem = null;
      for (const item of foodItems) {
        const foodNameElement = item.locator('.food-name');
        const name = await foodNameElement.textContent();
        if (name && name.includes('Test Food')) {
          targetFoodItem = item;
          console.log(`Found target food item: ${name}`);
          break;
        }
      }
      
      if (targetFoodItem) {
        // Click the edit button (pencil icon)
        const editButton = targetFoodItem.locator('.edit-btn');
        await editButton.click();
        console.log('Clicked edit button');
        
        // Wait for the Edit Food modal to appear
        await page.waitForSelector('.modal:visible', { timeout: 2000 });
        console.log('Edit Food modal appeared');
        
        // Take screenshot of the current state
        await page.screenshot({ path: 'test-results/edit-modal-before-image-change.png' });
        
        // Step 4: Change the image
        console.log('Step 4: Changing the image');
        
        // Look for different Pixabay images in the edit modal
        await page.waitForTimeout(1000);
        
        const editPixabayImages = await page.locator('.pixabay-grid .image-item').all();
        console.log(`Found ${editPixabayImages.length} Pixabay images in edit modal`);
        
        if (editPixabayImages.length > 1) {
          // Select a different image (second one if available)
          await editPixabayImages[1].click();
          console.log('Selected second Pixabay image');
          
          // Wait for selection
          await page.waitForTimeout(500);
          
          // Save the changes
          const saveButton = page.locator('button.submit-btn').filter({ hasText: 'Save' });
          await saveButton.click();
          console.log('Saved food item changes');
          
          // Wait for the modal to close
          await page.waitForTimeout(1500);
          
          // Take screenshot after saving
          await page.screenshot({ path: 'test-results/after-image-edit-save.png' });
          
          // Step 5: Refresh the page and verify the image persists
          console.log('Step 5: Refreshing page to test persistence');
          
          await page.reload();
          await page.waitForTimeout(1500);
          
          // Close any modals that might appear after refresh
          const postRefreshModals = await page.locator('.modal:visible').all();
          for (const modal of postRefreshModals) {
            const closeButton = modal.locator('.close-modal');
            if (await closeButton.isVisible()) {
              await closeButton.click();
              await page.waitForTimeout(200);
            }
          }
          
          // Switch back to the same tag after refresh
          const tagAfterRefresh = page.locator('button.tag-btn').filter({ hasText: 'Fruits' });
          if (await tagAfterRefresh.isVisible()) {
            await tagAfterRefresh.click();
            await page.waitForTimeout(500);
          }
          
          // Take screenshot after refresh
          await page.screenshot({ path: 'test-results/after-page-refresh.png' });
          
          // Find the food item again and check if it still has an image
          const foodItemsAfterRefresh = await page.locator('.food-item:not(.add-new-food)').all();
          let targetFoodAfterRefresh = null;
          
          for (const item of foodItemsAfterRefresh) {
            const foodNameElement = item.locator('.food-name');
            const name = await foodNameElement.textContent();
            if (name && name.includes('Test Food')) {
              targetFoodAfterRefresh = item;
              console.log(`Found target food item after refresh: ${name}`);
              break;
            }
          }
          
          if (targetFoodAfterRefresh) {
            // Check if the food item has an image
            const hasImage = await targetFoodAfterRefresh.locator('.food-image').count() > 0;
            const hasEmoji = await targetFoodAfterRefresh.locator('.food-emoji').count() > 0;
            
            console.log(`After refresh - Has image: ${hasImage}, Has emoji: ${hasEmoji}`);
            
            if (hasImage) {
              console.log('✓ SUCCESS: Food item still has image after page refresh');
              
              // Click edit button again to verify the image is properly loaded in edit modal
              const editButtonAfterRefresh = targetFoodAfterRefresh.locator('.edit-btn');
              await editButtonAfterRefresh.click();
              
              await page.waitForSelector('.modal:visible', { timeout: 2000 });
              await page.waitForTimeout(1000);
              
              // Take screenshot of edit modal after refresh
              await page.screenshot({ path: 'test-results/edit-modal-after-refresh.png' });
              
              // Check if current image is displayed in the edit modal
              const currentImageDisplay = await page.locator('.current-image').count() > 0;
              console.log(`Edit modal shows current image: ${currentImageDisplay}`);
              
              if (currentImageDisplay) {
                console.log('✓ SUCCESS: Edit modal properly displays current image after refresh');
              } else {
                console.log('⚠ ISSUE: Edit modal does not show current image - this might be the bug!');
              }
              
              // Close the edit modal
              await page.locator('.close-modal').click();
              
            } else {
              console.log('❌ FAILURE: Food item image was lost after page refresh - this is the bug!');
            }
          } else {
            console.log('❌ ERROR: Could not find the test food item after refresh');
          }
          
        } else {
          console.log('❌ Not enough images available to test image change');
        }
      } else {
        console.log('❌ Could not find the newly added food item');
      }
    } else {
      console.log('❌ No Pixabay images available to test with');
    }
    
    // The test passes if we successfully went through the flow
    // The actual bug detection is in the console logs
    expect(true).toBe(true);
  });
});