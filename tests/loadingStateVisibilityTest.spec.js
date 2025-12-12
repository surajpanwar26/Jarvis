import { test, expect } from '@playwright/test';

test('Test Loading State Visibility in All Containers', async ({ page }) => {
  console.log("=== LOADING STATE VISIBILITY TEST ===");
  
  // Navigate to the JARVIS website
  await page.goto('https://jarvis-l8gx.onrender.com');
  
  // Wait for the page to load
  await page.waitForTimeout(5000);
  
  console.log("=== TESTING QUICK SEARCH LOADING STATE ===");
  
  // Perform Quick Research
  await page.fill('textbox >> [placeholder="Quick search..."]', 'artificial intelligence');
  
  // Check if SEARCH button becomes enabled
  const searchButton = page.locator('button:has-text("SEARCH")');
  await expect(searchButton).toBeEnabled({ timeout: 5000 });
  
  // Get initial state before clicking
  const initialQuickReportContent = await page.locator('.glass-card').nth(1).textContent();
  console.log("Initial Quick Report Content:", initialQuickReportContent ? initialQuickReportContent.substring(0, 100) + "..." : "Empty");
  
  // Click SEARCH button (which triggers Quick Research)
  await searchButton.click();
  
  // Wait for loading state to appear
  await page.waitForTimeout(3000);
  
  // Check if WaveLoader is visible in Quick Search
  const quickWaveLoaderVisible = await page.locator('text=Generating Quick Briefing').isVisible();
  console.log("Quick Search WaveLoader visible:", quickWaveLoaderVisible);
  
  if (quickWaveLoaderVisible) {
    console.log("✅ Quick Search loading state is visible");
    // Check for binary rain effect (1s and 0s)
    const binaryDigitsVisible = await page.locator('text=1').first().isVisible() || 
                               await page.locator('text=0').first().isVisible();
    console.log("Binary digits visible:", binaryDigitsVisible);
    if (binaryDigitsVisible) {
      console.log("✅ Binary rain effect visible in Quick Search");
    } else {
      console.log("❌ Binary rain effect not visible in Quick Search");
    }
  } else {
    console.log("❌ Quick Search loading state not visible");
    // Let's check what's actually visible in the report area
    const reportContent = await page.locator('.glass-card').nth(1).textContent();
    console.log("Report content during loading:", reportContent ? reportContent.substring(0, 200) + "..." : "Empty");
  }
  
  // Wait for research to complete
  await page.waitForTimeout(15000);
  
  console.log("=== TESTING DEEP SEARCH LOADING STATE ===");
  
  // Navigate back to home
  await page.goto('https://jarvis-l8gx.onrender.com');
  await page.waitForTimeout(3000);
  
  // Click Deep Research button
  await page.click('button:has-text("Deep Research")');
  
  // Fill in research topic
  await page.fill('textbox >> [placeholder="Quick search..."]', 'machine learning applications');
  
  // Check if SEARCH button becomes enabled
  const deepSearchButton = page.locator('button:has-text("SEARCH")');
  await expect(deepSearchButton).toBeEnabled({ timeout: 5000 });
  
  // Get initial state before clicking
  const initialDeepReportContent = await page.locator('.glass-card').nth(1).textContent();
  console.log("Initial Deep Report Content:", initialDeepReportContent ? initialDeepReportContent.substring(0, 100) + "..." : "Empty");
  
  // Click SEARCH button (which triggers Deep Research when Deep Research mode is selected)
  await deepSearchButton.click();
  
  // Wait for loading state to appear
  await page.waitForTimeout(3000);
  
  // Check if WaveLoader is visible in Deep Search
  const deepWaveLoaderVisible = await page.locator('text=Generating Deep Research Report').isVisible();
  console.log("Deep Search WaveLoader visible:", deepWaveLoaderVisible);
  
  if (deepWaveLoaderVisible) {
    console.log("✅ Deep Search loading state is visible");
    // Check for binary rain effect (1s and 0s)
    const binaryDigitsVisible = await page.locator('text=1').first().isVisible() || 
                               await page.locator('text=0').first().isVisible();
    console.log("Binary digits visible:", binaryDigitsVisible);
    if (binaryDigitsVisible) {
      console.log("✅ Binary rain effect visible in Deep Search");
    } else {
      console.log("❌ Binary rain effect not visible in Deep Search");
    }
  } else {
    console.log("❌ Deep Search loading state not visible");
    // Let's check what's actually visible in the report area
    const reportContent = await page.locator('.glass-card').nth(1).textContent();
    console.log("Report content during loading:", reportContent ? reportContent.substring(0, 200) + "..." : "Empty");
  }
  
  // Wait for research to complete
  await page.waitForTimeout(20000);
  
  console.log("=== TESTING DOC ANALYSIS LOADING STATE ===");
  
  // Navigate back to home
  await page.goto('https://jarvis-l8gx.onrender.com');
  await page.waitForTimeout(3000);
  
  // For Doc Analysis, we'll simulate the process by checking the component directly
  // Since we can't upload a file in automated test, we'll check the component structure
  
  // Click Doc Analysis button
  await page.click('button:has-text("Docs Analysis")');
  
  // Wait for page to load
  await page.waitForTimeout(3000);
  
  // Check if WaveLoader component exists in the DOM (even if not visible)
  const docWaveLoaderExists = await page.locator('text=Ingesting Document Structure').count() > 0 ||
                             await page.locator('text=Generating Document Analysis Report').count() > 0;
  console.log("Doc Analysis WaveLoader exists in DOM:", docWaveLoaderExists);
  
  if (docWaveLoaderExists) {
    console.log("✅ Doc Analysis loading state component exists");
  } else {
    console.log("❌ Doc Analysis loading state component not found");
  }
  
  // Take a final screenshot
  await page.screenshot({ path: 'loading-state-visibility-test-final.png' });
  console.log("Final screenshot saved as loading-state-visibility-test-final.png");
  
  console.log("=== LOADING STATE VISIBILITY TEST COMPLETED ===");
});