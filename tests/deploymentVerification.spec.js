import { test, expect } from '@playwright/test';

test('Verify deployment with updated configuration', async ({ page }) => {
  console.log("=== DEPLOYMENT VERIFICATION TEST ===");
  
  // Navigate to the JARVIS website
  await page.goto('https://jarvis-l8gx.onrender.com');
  
  // Wait for the page to load
  await page.waitForTimeout(3000);
  
  // Check if API configuration is correct
  const logs = await page.evaluate(() => {
    // Capture console logs
    const logs = [];
    console.log = (function(log) {
      return function(...args) {
        logs.push(args.join(' '));
        log.apply(console, args);
      };
    })(console.log);
    
    // Trigger the config status log if it exists
    if (typeof window.logConfigStatus === 'function') {
      window.logConfigStatus();
    }
    
    return logs;
  });
  
  console.log("Console logs captured:");
  logs.forEach(log => console.log("  " + log));
  
  // Check for API URL in logs
  const apiLog = logs.find(log => log.includes('API URL:'));
  if (apiLog) {
    console.log("API URL Log:", apiLog);
    if (apiLog.includes('render.com')) {
      console.log("✅ API URL correctly points to Render backend");
    } else if (apiLog.includes('localhost')) {
      console.log("❌ API URL still points to localhost");
    }
  } else {
    console.log("⚠️ No API URL log found");
  }
  
  // Try to perform a quick research
  console.log("=== TESTING QUICK RESEARCH ===");
  
  // Fill in the research topic
  await page.fill('[placeholder="Enter a topic to research..."]', 'messi');
  
  // Click the Quick Research button
  await page.click('text=Quick Research');
  
  // Wait for some time to see if the research starts
  await page.waitForTimeout(5000);
  
  // Check if we see any error messages
  const errorMessages = await page.locator('text=failed').count();
  if (errorMessages > 0) {
    console.log("❌ Error messages detected");
    const errorText = await page.locator('text=failed').first().textContent();
    console.log("Error:", errorText);
  } else {
    console.log("✅ No immediate error messages detected");
  }
  
  // Check if we see research progress
  const progressElements = await page.locator('text=Starting').count();
  if (progressElements > 0) {
    console.log("✅ Research process started");
  } else {
    console.log("⚠️ Research process not clearly started");
  }
});