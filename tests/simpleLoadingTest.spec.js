import { test, expect } from '@playwright/test';

test('Simple Loading State Test', async ({ page }) => {
  console.log("=== SIMPLE LOADING STATE TEST ===");
  
  // Navigate to the JARVIS website
  await page.goto('https://jarvis-l8gx.onrender.com');
  
  // Wait for the page to load
  await page.waitForTimeout(5000);
  
  // Get page title
  const title = await page.title();
  console.log(`Page title: ${title}`);
  
  // Check for key elements
  const inputFields = await page.locator('textbox').count();
  const buttons = await page.locator('button').count();
  console.log(`Input fields: ${inputFields}, Buttons: ${buttons}`);
  
  // Try to find the search input
  const searchInput = page.locator('textbox >> [placeholder="Quick search..."]');
  const inputVisible = await searchInput.isVisible();
  console.log(`Search input visible: ${inputVisible}`);
  
  if (inputVisible) {
    // Fill in a search term
    await searchInput.fill('test topic');
    console.log("Filled search input");
    
    // Check if search button is enabled
    const searchButton = page.locator('button:has-text("SEARCH")');
    const buttonEnabled = await searchButton.isEnabled();
    console.log(`Search button enabled: ${buttonEnabled}`);
    
    if (buttonEnabled) {
      // Click the search button
      await searchButton.click();
      console.log("Clicked search button");
      
      // Wait a moment for loading state
      await page.waitForTimeout(2000);
      
      // Check for loading state
      const loadingText = await page.locator('text=Generating').count();
      console.log(`Loading text elements found: ${loadingText}`);
      
      if (loadingText > 0) {
        const loadingTextContent = await page.locator('text=Generating').first().textContent();
        console.log(`Loading text content: ${loadingTextContent}`);
      }
      
      // Check for binary rain (1s and 0s)
      const binaryOnes = await page.locator('text=1').count();
      const binaryZeros = await page.locator('text=0').count();
      console.log(`Binary 1s found: ${binaryOnes}, 0s found: ${binaryZeros}`);
    }
  } else {
    console.log("Search input not visible, checking page content");
    const pageContent = await page.textContent('body');
    console.log(`Page content sample: ${pageContent?.substring(0, 500)}...`);
  }
  
  // Take a screenshot
  await page.screenshot({ path: 'simple-loading-test.png' });
  console.log("Screenshot saved as simple-loading-test.png");
  
  console.log("=== SIMPLE LOADING STATE TEST COMPLETED ===");
});