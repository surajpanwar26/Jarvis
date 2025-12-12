import { test, expect } from '@playwright/test';

test('Test Report Generation in UI', async ({ page }) => {
  console.log("=== REPORT GENERATION UI TEST ===");
  
  // Navigate to the JARVIS website
  await page.goto('https://jarvis-l8gx.onrender.com');
  
  // Wait for the page to load
  await page.waitForTimeout(5000);
  
  // Check if the page loaded correctly
  const title = await page.title();
  console.log(`Page title: ${title}`);
  
  // Perform Quick Research
  console.log("=== PERFORMING QUICK RESEARCH ===");
  
  // Fill in research topic
  await page.fill('[placeholder="Enter a topic to research..."]', 'artificial intelligence');
  
  // Click Quick Research button
  await page.click('button:has-text("Quick Research")');
  
  // Wait and observe the research process
  console.log("Waiting for research to complete...");
  await page.waitForTimeout(30000); // Wait up to 30 seconds
  
  // Check for research progress indicators
  const progressElements = await page.locator('text=Starting').count();
  const planningElements = await page.locator('text=Planning').count();
  const searchingElements = await page.locator('text=Searching').count();
  const draftingElements = await page.locator('text=Drafting').count();
  const completedElements = await page.locator('text=Completed').count();
  
  console.log(`Progress elements: ${progressElements}`);
  console.log(`Planning elements: ${planningElements}`);
  console.log(`Searching elements: ${searchingElements}`);
  console.log(`Drafting elements: ${draftingElements}`);
  console.log(`Completed elements: ${completedElements}`);
  
  // Check for error messages
  const errorMessages = await page.locator('text=failed').count();
  console.log(`Error messages: ${errorMessages}`);
  
  if (errorMessages > 0) {
    console.log("❌ Error messages detected during research");
    // Get first few error messages
    for (let i = 0; i < Math.min(errorMessages, 3); i++) {
      const errorText = await page.locator('text=failed').nth(i).textContent();
      console.log(`Error ${i+1}: ${errorText}`);
    }
  } else {
    console.log("✅ No error messages detected");
  }
  
  // Check if report content is visible
  console.log("=== CHECKING REPORT GENERATION ===");
  
  // Look for report content
  const reportContent = await page.locator('article, .report-content, #report, [class*="report"]').count();
  console.log(`Report content elements found: ${reportContent}`);
  
  // Check for specific report indicators
  const markdownElements = await page.locator('text=#, ##, ###').count();
  const listElements = await page.locator('li, ol, ul').count();
  const paragraphElements = await page.locator('p').count();
  
  console.log(`Markdown elements: ${markdownElements}`);
  console.log(`List elements: ${listElements}`);
  console.log(`Paragraph elements: ${paragraphElements}`);
  
  // Take a screenshot for verification
  await page.screenshot({ path: 'report-generation-test-result.png', fullPage: true });
  console.log("Screenshot saved as report-generation-test-result.png");
  
  // Report findings
  if (reportContent > 0 || markdownElements > 0 || paragraphElements > 5) {
    console.log("✅ Report content appears to be generated in the UI");
  } else if (completedElements > 0) {
    console.log("⚠️ Research completed but report content not clearly visible");
  } else if (errorMessages > 0) {
    console.log("❌ Research failed with errors, no report generated");
  } else {
    console.log("⚠️ Report generation status unclear");
  }
});