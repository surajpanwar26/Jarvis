import { test, expect } from '@playwright/test';

test('Test Quick Research Functionality', async ({ page }) => {
  console.log("=== QUICK RESEARCH FUNCTIONALITY TEST ===");
  
  // Navigate to the JARVIS website
  await page.goto('https://jarvis-l8gx.onrender.com');
  
  // Wait for the page to load
  await page.waitForTimeout(5000);
  
  // Check API configuration
  const logs = await page.evaluate(() => {
    const logs = [];
    const originalLog = console.log;
    console.log = function(...args) {
      logs.push(args.join(' '));
      originalLog.apply(console, args);
    };
    
    // Trigger config status log
    if (typeof window.logConfigStatus === 'function') {
      window.logConfigStatus();
    }
    
    console.log = originalLog; // Restore original console.log
    return logs;
  });
  
  // Check for API URL in logs
  const apiLogs = logs.filter(log => log.includes('API URL:'));
  console.log("API Configuration Logs:", apiLogs);
  
  const correctApiUrl = apiLogs.some(log => log.includes('jarvis-backend-nzcg.onrender.com'));
  if (correctApiUrl) {
    console.log("✅ API URL correctly configured");
  } else {
    console.log("❌ API URL configuration issue");
  }
  
  // Perform Quick Research
  console.log("=== PERFORMING QUICK RESEARCH ===");
  
  // Fill in research topic
  await page.fill('[placeholder="Enter a topic to research..."]', 'messi');
  
  // Click Quick Research button
  await page.click('button:has-text("Quick Research")');
  
  // Wait and observe the research process
  console.log("Waiting for research to start...");
  await page.waitForTimeout(10000);
  
  // Check for research progress indicators
  const progressIndicators = await page.locator('text=Starting').count();
  const planningIndicators = await page.locator('text=Planning').count();
  const searchingIndicators = await page.locator('text=Searching').count();
  const draftingIndicators = await page.locator('text=Drafting').count();
  
  console.log(`Progress indicators found: ${progressIndicators}`);
  console.log(`Planning indicators found: ${planningIndicators}`);
  console.log(`Searching indicators found: ${searchingIndicators}`);
  console.log(`Drafting indicators found: ${draftingIndicators}`);
  
  // Check for error messages
  const errorMessages = await page.locator('text=failed').count();
  const errorMessageTexts = [];
  for (let i = 0; i < Math.min(errorMessages, 3); i++) {
    const errorText = await page.locator('text=failed').nth(i).textContent();
    errorMessageTexts.push(errorText);
  }
  
  if (errorMessages > 0) {
    console.log(`❌ Error messages detected: ${errorMessages}`);
    console.log("Error details:", errorMessageTexts);
  } else {
    console.log("✅ No error messages detected");
  }
  
  // Check if research seems to be progressing
  const hasProgress = progressIndicators > 0 || planningIndicators > 0 || searchingIndicators > 0 || draftingIndicators > 0;
  if (hasProgress) {
    console.log("✅ Research process appears to be progressing");
  } else {
    console.log("⚠️ Research process not clearly progressing");
  }
  
  // Take a screenshot for verification
  await page.screenshot({ path: 'quick-research-test-progress.png' });
  console.log("Screenshot saved as quick-research-test-progress.png");
});