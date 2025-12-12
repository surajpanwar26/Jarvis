import { test, expect } from '@playwright/test';

test('Detailed WaveLoader DOM Analysis', async ({ page }) => {
  console.log("=== DETAILED WAVELOADER DOM ANALYSIS ===");
  
  // Navigate to the JARVIS website
  await page.goto('https://jarvis-l8gx.onrender.com');
  
  // Wait for the page to load
  await page.waitForTimeout(5000);
  
  // Fill in research topic
  console.log("Filling in research topic...");
  await page.fill('[placeholder="Quick search..."]', 'detailed loading test');
  
  // Click the SEARCH button
  console.log("Clicking SEARCH button...");
  await page.click('button:has-text("SEARCH")');
  
  // Wait for loading state to appear
  console.log("Waiting for loading state...");
  await page.waitForTimeout(3000);
  
  // Check for the WaveLoader component by its structure
  const waveLoaderExists = await page.locator('.flex.flex-col.items-center.justify-center.h-full.bg-black\\/30.rounded-xl.p-4').count();
  console.log(`WaveLoader container found: ${waveLoaderExists}`);
  
  // Check for binary rain effect specifically
  const binaryRainContainer = await page.locator('.flex.space-x-1.mb-6.h-20.overflow-hidden').count();
  console.log(`Binary rain container found: ${binaryRainContainer}`);
  
  // Count binary digits
  const binaryOnes = await page.locator('text=1').count();
  const binaryZeros = await page.locator('text=0').count();
  console.log(`Binary digits - 1s: ${binaryOnes}, 0s: ${binaryZeros}`);
  
  // Check for the message element
  const messageElements = await page.locator('.text-cyan-400.font-mono.text-sm.tracking-wider').count();
  console.log(`Message elements found: ${messageElements}`);
  
  if (messageElements > 0) {
    const messageText = await page.locator('.text-cyan-400.font-mono.text-sm.tracking-wider').textContent();
    console.log(`Message text: ${messageText}`);
  }
  
  // Take a screenshot
  await page.screenshot({ path: 'detailed-waveloader-analysis.png' });
  console.log("Screenshot saved as detailed-waveloader-analysis.png");
  
  // Check the full DOM structure of the report area
  const reportArea = await page.locator('.glass-card').nth(1);
  const reportAreaHTML = await reportArea.innerHTML();
  console.log("Report area HTML (first 1000 chars):", reportAreaHTML.substring(0, 1000));
  
  if (waveLoaderExists > 0 && binaryRainContainer > 0) {
    console.log("✅ WaveLoader component is present and rendering");
    if (binaryOnes > 0 || binaryZeros > 0) {
      console.log("✅ Binary rain effect is visible");
    }
  } else {
    console.log("❌ WaveLoader component structure not found");
  }
  
  console.log("=== DETAILED WAVELOADER DOM ANALYSIS COMPLETED ===");
});