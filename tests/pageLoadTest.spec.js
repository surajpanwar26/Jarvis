import { test, expect } from '@playwright/test';

test('Test Page Load and Structure', async ({ page }) => {
  console.log("=== PAGE LOAD AND STRUCTURE TEST ===");
  
  // Navigate to the JARVIS website
  await page.goto('https://jarvis-l8gx.onrender.com');
  
  // Wait for the page to load
  await page.waitForTimeout(5000);
  
  // Check if the page loaded correctly
  const title = await page.title();
  console.log(`Page title: ${title}`);
  
  // Capture console logs
  const logs = [];
  page.on('console', msg => logs.push(msg.text()));
  
  // Check page structure
  const body = await page.locator('body');
  const bodyCount = await body.count();
  console.log(`Body elements: ${bodyCount}`);
  
  // Check for key UI elements
  const inputField = await page.locator('[placeholder*="research"]').count();
  const quickResearchBtn = await page.locator('button:has-text("Quick Research")').count();
  const deepResearchBtn = await page.locator('button:has-text("Deep Research")').count();
  
  console.log(`Input fields with 'research' placeholder: ${inputField}`);
  console.log(`Quick Research buttons: ${quickResearchBtn}`);
  console.log(`Deep Research buttons: ${deepResearchBtn}`);
  
  // Check for any visible errors
  const errorElements = await page.locator('text=error, text=failed, text=exception').count();
  console.log(`Visible error elements: ${errorElements}`);
  
  // Print console logs
  console.log("Console logs:");
  logs.forEach((log, index) => {
    console.log(`  ${index + 1}. ${log}`);
  });
  
  // Take a screenshot
  await page.screenshot({ path: 'page-structure-test.png', fullPage: true });
  console.log("Screenshot saved as page-structure-test.png");
  
  // Report findings
  if (inputField > 0 && (quickResearchBtn > 0 || deepResearchBtn > 0)) {
    console.log("✅ Page loaded correctly with research UI elements");
  } else {
    console.log("⚠️ Page structure may have issues");
  }
  
  if (errorElements > 0) {
    console.log("⚠️ Some error elements detected on page");
  }
});