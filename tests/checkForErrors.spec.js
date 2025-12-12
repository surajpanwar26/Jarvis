import { test, expect } from '@playwright/test';

test('Check for JavaScript Errors', async ({ page }) => {
  console.log("=== CHECK FOR JAVASCRIPT ERRORS ===");
  
  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
    console.log(`Console ${msg.type()}: ${msg.text()}`);
  });
  
  // Capture page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
    console.log(`Page Error: ${error.message}`);
  });
  
  // Navigate to the JARVIS website
  await page.goto('https://jarvis-l8gx.onrender.com');
  
  // Wait for the page to load
  await page.waitForTimeout(5000);
  
  // Fill in research topic
  console.log("Filling in research topic...");
  await page.fill('[placeholder="Quick search..."]', 'error check test');
  
  // Click the SEARCH button
  console.log("Clicking SEARCH button...");
  await page.click('button:has-text("SEARCH") >> nth=2');
  
  // Wait for any errors
  await page.waitForTimeout(3000);
  
  // Log all captured messages
  console.log("=== CONSOLE MESSAGES ===");
  consoleMessages.forEach((msg, index) => {
    console.log(`${index + 1}. [${msg.type}] ${msg.text}`);
  });
  
  console.log("=== PAGE ERRORS ===");
  pageErrors.forEach((error, index) => {
    console.log(`${index + 1}. ${error}`);
  });
  
  // Take a screenshot
  await page.screenshot({ path: 'error-check.png' });
  console.log("Screenshot saved as error-check.png");
  
  console.log("=== CHECK FOR JAVASCRIPT ERRORS COMPLETED ===");
});