import { test, expect } from '@playwright/test';

test('Debug Navigation and Button States', async ({ page }) => {
  console.log("=== DEBUG NAVIGATION AND BUTTON STATES ===");
  
  // Navigate to the JARVIS website
  await page.goto('https://jarvis-l8gx.onrender.com');
  
  // Wait for the page to load
  await page.waitForTimeout(5000);
  
  // Check initial button states
  const searchButton = page.locator('button:has-text("SEARCH")').nth(2); // Get the third button which should be the actual SEARCH button
  const isSearchButtonDisabled = await searchButton.isDisabled();
  console.log(`SEARCH button initially disabled: ${isSearchButtonDisabled}`);
  
  // Fill in research topic
  console.log("Filling in research topic...");
  await page.fill('[placeholder="Quick search..."]', 'debug test');
  
  // Check button state after filling
  await page.waitForTimeout(500);
  const isSearchButtonDisabledAfterFill = await searchButton.isDisabled();
  console.log(`SEARCH button disabled after filling: ${isSearchButtonDisabledAfterFill}`);
  
  // Try to click the button
  console.log("Attempting to click SEARCH button...");
  try {
    await searchButton.click();
    console.log("Click action completed");
  } catch (error) {
    console.log(`Click failed with error: ${error}`);
  }
  
  // Wait a moment and check URL
  await page.waitForTimeout(2000);
  const currentUrl = page.url();
  console.log(`URL after click attempt: ${currentUrl}`);
  
  // Check if we navigated
  const isHomePage = currentUrl === 'https://jarvis-l8gx.onrender.com/';
  console.log(`Still on home page: ${isHomePage}`);
  
  // Take a screenshot
  await page.screenshot({ path: 'debug-navigation.png' });
  console.log("Screenshot saved as debug-navigation.png");
  
  console.log("=== DEBUG NAVIGATION AND BUTTON STATES COMPLETED ===");
});