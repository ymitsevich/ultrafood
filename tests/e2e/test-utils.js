// Test utility for authentication in E2E tests

/**
 * Authenticates a mock user in the test environment
 * This should be called at the beginning of tests that need an authenticated user
 * @param {import('@playwright/test').Page} page - The Playwright page object
 */
export async function authenticateTestUser(page) {
  console.log('Setting up test authentication...');
  
  // Wait for the app to load
  await page.waitForLoadState('networkidle');
  
  // Check if we're already authenticated (food grid is visible)
  const foodGridVisible = await page.locator('.food-grid').isVisible();
  if (foodGridVisible) {
    console.log('User already authenticated, skipping authentication setup');
    return;
  }
  
  // Check if login prompt is visible (indicating non-authenticated state)
  const loginPromptVisible = await page.locator('.login-prompt').isVisible();
  if (loginPromptVisible) {
    console.log('Login prompt detected, authenticating user...');
    
    // Try to authenticate using the login button in the prompt
    const loginButton = page.locator('.login-cta-button');
    if (await loginButton.isVisible()) {
      await loginButton.click();
      console.log('Clicked login button in prompt');
    } else {
      // Fallback: try menu login
      const menuButton = page.locator('.menu-button');
      if (await menuButton.isVisible()) {
        await menuButton.click();
        await page.waitForTimeout(500);
        
        // Look for login menu item
        const loginMenuItem = page.locator('.menu-item').filter({ hasText: /login|Login/ });
        if (await loginMenuItem.isVisible()) {
          await loginMenuItem.click();
          console.log('Clicked login from menu');
        }
      }
    }
    
    // Wait for the authentication to complete and food grid to appear
    await page.waitForSelector('.food-grid', { timeout: 10000 });
    console.log('Test user authenticated successfully');
  } else {
    // If neither food grid nor login prompt is visible, something is wrong
    console.log('Warning: Neither food grid nor login prompt detected');
    
    // Try to force authentication via direct service call
    await page.evaluate(() => {
      if (window.__container && window.__container.resolve) {
        const auth = window.__container.resolve('auth');
        if (auth && auth.signInWithGoogle) {
          return auth.signInWithGoogle();
        }
      }
      return Promise.resolve();
    });
    
    // Wait for food grid to appear
    await page.waitForSelector('.food-grid', { timeout: 5000 });
    console.log('Forced authentication completed');
  }
}

/**
 * Signs out the test user
 * @param {import('@playwright/test').Page} page - The Playwright page object
 */
export async function signOutTestUser(page) {
  console.log('Signing out test user...');
  
  await page.evaluate(() => {
    if (window.__container && window.__container.resolve) {
      const auth = window.__container.resolve('auth');
      if (auth && auth.signOut) {
        return auth.signOut();
      }
    }
    return Promise.resolve();
  });
  
  // Wait for login prompt to appear
  await page.waitForSelector('.login-prompt', { timeout: 3000 });
  console.log('Test user signed out successfully');
}

/**
 * Closes any language modal that might be open
 * @param {import('@playwright/test').Page} page - The Playwright page object
 */
export async function closeLanguageModal(page) {
  const languageModalSelector = '.modal-content.language-modal';
  const isVisible = await page.locator(languageModalSelector).isVisible();
  
  if (isVisible) {
    console.log('Closing language modal...');
    await page.locator(`${languageModalSelector} .close-modal`).click();
    await page.waitForTimeout(200);
  }
}

/**
 * Complete test setup including authentication and modal closing
 * @param {import('@playwright/test').Page} page - The Playwright page object
 */
export async function setupTest(page) {
  // Go to the application
  await page.goto('/');
  
  // Close any language modal if present
  await closeLanguageModal(page);
  
  // Authenticate test user
  await authenticateTestUser(page);
  
  // Clear any existing basket items
  await page.evaluate(() => {
    if (window.localStorage) {
      window.localStorage.removeItem('basket');
    }
    
    // Reset basket if accessible
    if (window.basket && typeof window.basket.clear === 'function') {
      window.basket.clear();
    }
  });
  
  console.log('Test setup completed');
}
