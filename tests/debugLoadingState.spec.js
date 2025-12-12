import { test, expect } from '@playwright/test';

test('Debug Loading State Behavior', async ({ page }) => {
  console.log("=== DEBUG LOADING STATE BEHAVIOR ===");
  
  // Navigate to the JARVIS website
  await page.goto('https://jarvis-l8gx.onrender.com');
  
  // Wait for the page to load
  await page.waitForTimeout(5000);
  
  // Fill in research topic
  console.log("Filling in research topic...");
  await page.fill('[placeholder="Quick search..."]', 'debug loading state');
  
  // Click Quick Research button
  console.log("Clicking Quick Research button...");
  await page.click('button:has-text("Quick Research")');
  
  // Check page content immediately after click
  await page.waitForTimeout(500);
  const contentAfterClick = await page.locator('body').textContent();
  console.log("Content immediately after click (first 500 chars):", contentAfterClick?.substring(0, 500));
  
  // Check for any status indicators
  const statusIndicators = await page.locator('text=Planning, Searching, Synthesizing, Generating').count();
  console.log(`Status indicators found: ${statusIndicators}`);
  
  // Wait a bit more and check again
  await page.waitForTimeout(1000);
  const contentAfterWait = await page.locator('body').textContent();
  console.log("Content after 1.5s (first 500 chars):", contentAfterWait?.substring(0, 500));
  
  // Check for any loading text
  const loadingText = await page.locator('text=Loading, Generating, Processing').count();
  console.log(`Loading text found: ${loadingText}`);
  
  // Take a screenshot
  await page.screenshot({ path: 'debug-loading-state.png' });
  console.log("Screenshot saved as debug-loading-state.png");
  
  console.log("=== DEBUG LOADING STATE BEHAVIOR COMPLETED ===");
});