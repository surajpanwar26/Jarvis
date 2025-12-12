import { test, expect } from '@playwright/test';

test('Verify WaveLoader Component Exists', async ({ page }) => {
  console.log("=== VERIFY WAVELOADER COMPONENT EXISTS ===");
  
  // Navigate to the JARVIS website
  await page.goto('https://jarvis-l8gx.onrender.com');
  
  // Wait for the page to load
  await page.waitForTimeout(5000);
  
  // Fill in research topic
  console.log("Filling in research topic...");
  await page.fill('[placeholder="Quick search..."]', 'test loading state');
  
  // Click the SEARCH button (not the Quick Research tab button)
  console.log("Clicking SEARCH button...");
  await page.click('button:has-text("SEARCH")');
  
  // Wait for loading state to appear
  console.log("Waiting for loading state...");
  await page.waitForTimeout(3000);
  
  // Check for WaveLoader elements
  const waveLoaderMessage = await page.locator('text=Generating Quick Briefing').count();
  console.log(`WaveLoader message found: ${waveLoaderMessage}`);
  
  // Check for binary rain effect
  const binaryOnes = await page.locator('text=1').count();
  const binaryZeros = await page.locator('text=0').count();
  console.log(`Binary rain - 1s: ${binaryOnes}, 0s: ${binaryZeros}`);
  
  // Take a screenshot
  await page.screenshot({ path: 'waveloader-test.png' });
  console.log("Screenshot saved as waveloader-test.png");
  
  if (waveLoaderMessage > 0) {
    console.log("✅ WaveLoader component is present");
    if (binaryOnes > 0 || binaryZeros > 0) {
      console.log("✅ Binary rain effect is working");
    } else {
      console.log("⚠️ WaveLoader present but binary rain not visible");
    }
  } else {
    console.log("❌ WaveLoader component not found during loading");
  }
  
  console.log("=== WAVELOADER VERIFICATION COMPLETED ===");
});