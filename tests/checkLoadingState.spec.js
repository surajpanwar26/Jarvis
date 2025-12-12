import { test, expect } from '@playwright/test';

test('Check Loading State Visibility', async ({ page }) => {
  console.log("=== CHECK LOADING STATE VISIBILITY ===");
  
  // Navigate to the JARVIS website
  await page.goto('https://jarvis-l8gx.onrender.com');
  
  // Wait for the page to load
  await page.waitForTimeout(5000);
  
  // Fill in research topic
  console.log("Filling in research topic...");
  await page.fill('[placeholder="Quick search..."]', 'loading state test');
  
  // Capture initial state
  const initialContent = await page.locator('.glass-card').nth(1).innerHTML();
  console.log("Initial report area content length:", initialContent.length);
  
  // Click Quick Research button to trigger the process
  console.log("Clicking Quick Research button...");
  await page.click('button:has-text("Quick Research")');
  
  // Wait a short time for the loading state to appear
  console.log("Waiting for loading state...");
  await page.waitForTimeout(2000);
  
  // Check what's in the report area during loading
  const loadingContent = await page.locator('.glass-card').nth(1).innerHTML();
  console.log("Report area content during loading length:", loadingContent.length);
  
  // Check for WaveLoader specific elements
  const waveLoaderVisible = await page.locator('text=Generating Quick Briefing').isVisible();
  console.log("WaveLoader visible:", waveLoaderVisible);
  
  // Check for binary rain effect (1s and 0s)
  const binaryOnes = await page.locator('text=1').count();
  const binaryZeros = await page.locator('text=0').count();
  console.log(`Binary digits - 1s: ${binaryOnes}, 0s: ${binaryZeros}`);
  
  if (waveLoaderVisible) {
    console.log("✅ WaveLoader is visible in Quick Search");
    if (binaryOnes > 0 || binaryZeros > 0) {
      console.log("✅ Binary rain effect is visible");
    } else {
      console.log("❌ Binary rain effect not visible");
    }
  } else {
    console.log("❌ WaveLoader not visible in Quick Search");
    console.log("Content during loading:", loadingContent.substring(0, 500) + "...");
  }
  
  // Take a screenshot during loading
  await page.screenshot({ path: 'loading-state-check.png' });
  console.log("Screenshot saved as loading-state-check.png");
  
  // Wait for completion
  await page.waitForTimeout(15000);
  
  console.log("=== LOADING STATE CHECK COMPLETED ===");
});