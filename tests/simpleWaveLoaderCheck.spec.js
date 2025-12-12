import { test, expect } from '@playwright/test';

test('Simple WaveLoader Visibility Check', async ({ page }) => {
  console.log("=== SIMPLE WAVELOADER VISIBILITY CHECK ===");
  
  // Navigate to the JARVIS website
  await page.goto('https://jarvis-l8gx.onrender.com');
  
  // Wait for the page to load
  await page.waitForTimeout(5000);
  
  // Fill in research topic
  console.log("Filling in research topic...");
  await page.fill('[placeholder="Quick search..."]', 'simple loading test');
  
  // Click the SEARCH button
  console.log("Clicking SEARCH button...");
  await page.click('button:has-text("SEARCH")');
  
  // Wait for loading state to appear
  console.log("Waiting for loading state...");
  await page.waitForTimeout(3000);
  
  // Take a screenshot first to visually confirm
  await page.screenshot({ path: 'simple-waveloader-check.png' });
  console.log("Screenshot saved as simple-waveloader-check.png");
  
  // Check if we're on the QuickResultPage now
  const url = page.url();
  console.log(`Current URL: ${url}`);
  
  // Check for binary digits which indicate the WaveLoader is rendering
  const binaryOnes = await page.locator('text=1').count();
  const binaryZeros = await page.locator('text=0').count();
  console.log(`Binary digits - 1s: ${binaryOnes}, 0s: ${binaryZeros}`);
  
  // Check for the specific message text
  const hasQuickBriefing = await page.locator('text=Generating Quick Briefing').isVisible();
  console.log(`'Generating Quick Briefing' text visible: ${hasQuickBriefing}`);
  
  if (binaryOnes > 0 || binaryZeros > 0) {
    console.log("✅ Binary rain effect is visible (WaveLoader is rendering)");
  } else {
    console.log("❌ Binary rain effect not visible");
  }
  
  if (hasQuickBriefing) {
    console.log("✅ 'Generating Quick Briefing' message is visible");
  } else {
    console.log("❌ 'Generating Quick Briefing' message not visible");
  }
  
  console.log("=== SIMPLE WAVELOADER VISIBILITY CHECK COMPLETED ===");
});