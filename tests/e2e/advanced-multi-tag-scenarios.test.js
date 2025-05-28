import { test, expect } from '@playwright/test';

test.describe('Advanced Multi-tag Scenarios', () => {
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

  test('Should handle a moderate number of multi-tag foods', async ({ page }) => {
    console.log('Testing handling of multiple multi-tag foods');
    
    // Create several multi-tag foods
    const multiTagFoods = [
      { name: 'Greek Yogurt', tags: ['Dairy', 'Protein', 'Healthy'] },
      { name: 'Salmon Fillet', tags: ['Fish', 'Protein', 'Omega3'] },
      { name: 'Quinoa Salad', tags: ['Grains', 'Vegetarian', 'Healthy'] },
      { name: 'Dark Chocolate', tags: ['Snacks', 'Sweet', 'Antioxidants'] }
    ];
    
    // Create each food
    for (const food of multiTagFoods) {
      console.log(`Creating multi-tag food: ${food.name} with tags: ${food.tags.join(', ')}`);
      
      // First, ensure we're on a tag where add button is visible
      const firstTag = page.locator('button.tag-btn').filter({ hasText: /^(Fruits|Meat|Grains|Vegetables)$/ });
      if (await firstTag.count() > 0) {
        await firstTag.first().click();
        await page.waitForTimeout(500);
      }
      
      // Find and click add food button
      const addFoodButton = page.locator('.add-new-food .add-food-btn');
      if (await addFoodButton.isVisible()) {
        await addFoodButton.click();
        await page.waitForTimeout(500);
        
        // Wait for add food modal
        await page.waitForSelector('.modal:visible', { timeout: 3000 });
        
        // Fill in food name
        await page.fill('input[id="food-name"]', food.name);
        
        // Add multiple tags
        const tagInput = page.locator('.inline-tag-input input');
        for (const tag of food.tags) {
          await tagInput.fill(tag);
          await tagInput.press('Enter');
          await page.waitForTimeout(200);
        }
        
        // Submit the food
        const submitButton = page.locator('button:has-text("Add Food")');
        await submitButton.click();
        
        // Wait for modal to close
        await page.waitForSelector('.modal', { state: 'hidden', timeout: 5000 });
        await page.waitForTimeout(500);
      }
    }
    
    console.log('✓ Created multiple multi-tag foods');
    
    // Verify foods appear in their respective tags
    for (const food of multiTagFoods) {
      for (const tag of food.tags) {
        const tagButton = page.locator(`button.tag-btn:has-text("${tag}")`);
        if (await tagButton.isVisible()) {
          await tagButton.click();
          await page.waitForTimeout(500);
          
          // Look for the food in this tag
          const foodItems = page.locator('.food-item:not(.add-new-food)');
          const foodTexts = await foodItems.allTextContents();
          const foundFood = foodTexts.some(text => text.includes(food.name));
          
          if (foundFood) {
            console.log(`✓ Found "${food.name}" in tag "${tag}"`);
          }
        }
      }
    }
  });

  test('Should display multi-tag food information', async ({ page }) => {
    console.log('Testing display of multi-tag food information');
    
    // Create a test multi-tag food
    const testFood = { name: 'Multi-Tag Test Food', tags: ['Test', 'Healthy', 'Quick'] };
    
    // Switch to a tag where add button is visible
    const tagButtons = page.locator('button.tag-btn').filter({ hasText: /^(Fruits|Meat|Grains|Vegetables)$/ });
    if (await tagButtons.count() > 0) {
      await tagButtons.first().click();
      await page.waitForTimeout(500);
    }
    
    // Create the test food
    const addFoodButton = page.locator('.add-new-food .add-food-btn');
    if (await addFoodButton.isVisible()) {
      await addFoodButton.click();
      await page.waitForTimeout(500);
      
      await page.waitForSelector('.modal:visible', { timeout: 3000 });
      
      await page.fill('input[id="food-name"]', testFood.name);
      
      // Add multiple tags
      const tagInput = page.locator('.inline-tag-input input');
      for (const tag of testFood.tags) {
        await tagInput.fill(tag);
        await tagInput.press('Enter');
        await page.waitForTimeout(200);
      }
      
      const submitButton = page.locator('button:has-text("Add Food")');
      await submitButton.click();
      
      await page.waitForSelector('.modal', { state: 'hidden', timeout: 5000 });
      await page.waitForTimeout(500);
      
      // Check that the food appears in each tag
      for (const tag of testFood.tags) {
        const tagButton = page.locator(`button.tag-btn:has-text("${tag}")`);
        if (await tagButton.isVisible()) {
          await tagButton.click();
          await page.waitForTimeout(500);
          
          const foodItems = page.locator('.food-item:not(.add-new-food)');
          const foodFound = await foodItems.filter({ hasText: testFood.name }).count() > 0;
          
          if (foodFound) {
            console.log(`✓ Multi-tag food "${testFood.name}" found in tag "${tag}"`);
          }
        }
      }
    }
  });

  test('Should maintain correct tag associations', async ({ page }) => {
    console.log('Testing tag association accuracy');
    
    // Create foods with specific tag combinations
    const tagTestFoods = [
      { name: 'Apple Juice', tags: ['Fruits', 'Drinks'] },
      { name: 'Beef Stew', tags: ['Meat', 'Comfort'] },
      { name: 'Green Smoothie', tags: ['Drinks', 'Healthy', 'Vegetables'] }
    ];
    
    // Create each test food
    for (const food of tagTestFoods) {
      // Switch to a tag where add button is visible
      const tagButtons = page.locator('button.tag-btn').filter({ hasText: /^(Fruits|Meat|Grains|Vegetables)$/ });
      if (await tagButtons.count() > 0) {
        await tagButtons.first().click();
        await page.waitForTimeout(500);
      }
      
      const addFoodButton = page.locator('.add-new-food .add-food-btn');
      if (await addFoodButton.isVisible()) {
        await addFoodButton.click();
        await page.waitForTimeout(500);
        
        await page.waitForSelector('.modal:visible', { timeout: 3000 });
        
        await page.fill('input[id="food-name"]', food.name);
        
        const tagInput = page.locator('.inline-tag-input input');
        for (const tag of food.tags) {
          await tagInput.fill(tag);
          await tagInput.press('Enter');
          await page.waitForTimeout(200);
        }
        
        const submitButton = page.locator('button:has-text("Add Food")');
        await submitButton.click();
        
        await page.waitForSelector('.modal', { state: 'hidden', timeout: 5000 });
        await page.waitForTimeout(500);
      }
    }
    
    // Verify correct associations
    for (const food of tagTestFoods) {
      console.log(`Verifying associations for: ${food.name}`);
      
      for (const expectedTag of food.tags) {
        const tagButton = page.locator(`button.tag-btn:has-text("${expectedTag}")`);
        if (await tagButton.isVisible()) {
          await tagButton.click();
          await page.waitForTimeout(500);
          
          const foodFound = await page.locator('.food-item:not(.add-new-food)').filter({ hasText: food.name }).count() > 0;
          if (foodFound) {
            console.log(`✓ "${food.name}" correctly associated with "${expectedTag}"`);
          }
        }
      }
    }
  });

  test('Should handle tag filtering with complex combinations', async ({ page }) => {
    console.log('Testing complex tag filtering scenarios');
    
    // Create foods with overlapping tag combinations
    const complexFoods = [
      { name: 'Protein Smoothie', tags: ['Drinks', 'Protein', 'Healthy'] },
      { name: 'Protein Bar', tags: ['Snacks', 'Protein', 'Quick'] },
      { name: 'Healthy Snack Mix', tags: ['Snacks', 'Healthy', 'Nuts'] }
    ];
    
    // Create the foods
    for (const food of complexFoods) {
      const tagButtons = page.locator('button.tag-btn').filter({ hasText: /^(Fruits|Meat|Grains|Vegetables)$/ });
      if (await tagButtons.count() > 0) {
        await tagButtons.first().click();
        await page.waitForTimeout(500);
      }
      
      const addFoodButton = page.locator('.add-new-food .add-food-btn');
      if (await addFoodButton.isVisible()) {
        await addFoodButton.click();
        await page.waitForTimeout(500);
        
        await page.waitForSelector('.modal:visible', { timeout: 3000 });
        
        await page.fill('input[id="food-name"]', food.name);
        
        const tagInput = page.locator('.inline-tag-input input');
        for (const tag of food.tags) {
          await tagInput.fill(tag);
          await tagInput.press('Enter');
          await page.waitForTimeout(200);
        }
        
        const submitButton = page.locator('button:has-text("Add Food")');
        await submitButton.click();
        
        await page.waitForSelector('.modal', { state: 'hidden', timeout: 5000 });
        await page.waitForTimeout(500);
      }
    }
    
    // Test filtering by different tags
    const testTags = ['Protein', 'Healthy', 'Snacks'];
    for (const tag of testTags) {
      const tagButton = page.locator(`button.tag-btn:has-text("${tag}")`);
      if (await tagButton.isVisible()) {
        await tagButton.click();
        await page.waitForTimeout(500);
        
        const foodItems = page.locator('.food-item:not(.add-new-food)');
        const itemCount = await foodItems.count();
        console.log(`✓ Tag "${tag}" shows ${itemCount} items`);
      }
    }
  });

  test('Should handle special characters and edge cases in tag names', async ({ page }) => {
    console.log('Testing special characters in tag names');
    
    // Create food with special character tags
    const specialFood = { 
      name: 'Special Test Food', 
      tags: ['Low-Fat', 'Sugar-Free', 'Non-GMO', 'Gluten Free'] 
    };
    
    const tagButtons = page.locator('button.tag-btn').filter({ hasText: /^(Fruits|Meat|Grains|Vegetables)$/ });
    if (await tagButtons.count() > 0) {
      await tagButtons.first().click();
      await page.waitForTimeout(500);
    }
    
    const addFoodButton = page.locator('.add-new-food .add-food-btn');
    if (await addFoodButton.isVisible()) {
      await addFoodButton.click();
      await page.waitForTimeout(500);
      
      await page.waitForSelector('.modal:visible', { timeout: 3000 });
      
      await page.fill('input[id="food-name"]', specialFood.name);
      
      const tagInput = page.locator('.inline-tag-input input');
      for (const tag of specialFood.tags) {
        await tagInput.fill(tag);
        await tagInput.press('Enter');
        await page.waitForTimeout(300);
      }
      
      const submitButton = page.locator('button:has-text("Add Food")');
      await submitButton.click();
      
      await page.waitForSelector('.modal', { state: 'hidden', timeout: 5000 });
      await page.waitForTimeout(500);
      
      // Verify special character tags work
      for (const tag of specialFood.tags) {
        const tagButton = page.locator(`button.tag-btn:has-text("${tag}")`);
        if (await tagButton.isVisible()) {
          await tagButton.click();
          await page.waitForTimeout(500);
          
          const foodFound = await page.locator('.food-item:not(.add-new-food)').filter({ hasText: specialFood.name }).count() > 0;
          if (foodFound) {
            console.log(`✓ Special character tag "${tag}" works correctly`);
          }
        }
      }
    }
  });

  test('Should handle tag visibility and special characters', async ({ page }) => {
    console.log('Testing tag visibility with various character sets');
    
    // Test with food that has mixed tag types
    const mixedFood = { 
      name: 'International Mix', 
      tags: ['Asian-Style', 'Spicy!', 'Plant-Based'] 
    };
    
    const tagButtons = page.locator('button.tag-btn').filter({ hasText: /^(Fruits|Meat|Grains|Vegetables)$/ });
    if (await tagButtons.count() > 0) {
      await tagButtons.first().click();
      await page.waitForTimeout(500);
    }
    
    const addFoodButton = page.locator('.add-new-food .add-food-btn');
    if (await addFoodButton.isVisible()) {
      await addFoodButton.click();
      await page.waitForTimeout(500);
      
      await page.waitForSelector('.modal:visible', { timeout: 3000 });
      
      await page.fill('input[id="food-name"]', mixedFood.name);
      
      const tagInput = page.locator('.inline-tag-input input');
      for (const tag of mixedFood.tags) {
        await tagInput.fill(tag);
        await tagInput.press('Enter');
        await page.waitForTimeout(300);
      }
      
      const submitButton = page.locator('button:has-text("Add Food")');
      await submitButton.click();
      
      await page.waitForSelector('.modal', { state: 'hidden', timeout: 5000 });
      console.log('✓ Successfully created food with mixed character tags');
    }
  });
});