import { test, expect } from '@playwright/test';

test('Detailed Production Test with Navigation Debug', async ({ page }) => {
  console.log('=== DETAILED PRODUCTION TEST ===');
  
  // Listen for console messages
  page.on('console', msg => {
    console.log(`Browser Console [${msg.type()}]: ${msg.text()}`);
  });
  
  // Listen for page errors
  page.on('pageerror', error => {
    console.log(`Page Error: ${error.message}`);
  });
  
  // Listen for request failures
  page.on('requestfailed', request => {
    console.log(`Request Failed: ${request.url()} - ${request.failure()?.errorText}`);
  });
  
  // Listen for response failures
  page.on('response', response => {
    if (!response.ok()) {
      console.log(`Response Error: ${response.status()} ${response.statusText()} for ${response.url()}`);
    }
  });
  
  // Navigate to the production deployment
  await page.goto('https://jarvis-l8gx.onrender.com');
  await page.waitForLoadState('networkidle');
  
  console.log('1. Production site loaded');
  
  // Take initial screenshot
  await page.screenshot({ path: 'test-results/detailed-prod-01-homepage.png', fullPage: true });
  
  // Check page elements
  const quickResearchTab = await page.locator('button:has-text("Quick Research")');
  const quickInput = await page.locator('input[placeholder="Quick search..."]');
  const searchButton = await page.getByRole('button', { name: 'SEARCH', exact: true });
  
  console.log('2. Quick Research tab exists:', await quickResearchTab.count() > 0);
  console.log('3. Quick search input exists:', await quickInput.count() > 0);
  console.log('4. Search button exists:', await searchButton.count() > 0);
  
  // Fill the input
  await quickInput.fill('Machine Learning Basics');
  console.log('5. Filled search input');
  
  // Check if search button is enabled
  const isDisabled = await searchButton.isDisabled();
  console.log('6. Search button disabled:', isDisabled);
  
  // Click the search button
  if (!isDisabled) {
    console.log('7. Clicking search button');
    await searchButton.click();
  } else {
    console.log('7. Search button is disabled, cannot click');
  }
  
  // Wait and monitor what happens
  console.log('8. Waiting for 5 seconds to observe behavior...');
  await page.waitForTimeout(5000);
  
  // Take screenshot after clicking search
  await page.screenshot({ path: 'test-results/detailed-prod-02-after-search.png', fullPage: true });
  
  // Check current URL
  const currentUrl = page.url();
  console.log('9. Current URL:', currentUrl);
  
  // Check page content
  const pageContent = await page.textContent('body');
  console.log('10. Page content (first 1000 chars):', pageContent?.substring(0, 1000));
  
  // Check if navigation happened by looking for specific elements
  const agentProgressSection = await page.locator('text=Agent Progress').count();
  const liveBriefingSection = await page.locator('text=Live Briefing').count();
  const backButton = await page.locator('button:has-text("New Research")').count();
  
  console.log('11. Agent Progress section found:', agentProgressSection > 0);
  console.log('12. Live Briefing section found:', liveBriefingSection > 0);
  console.log('13. Back button found:', backButton > 0);
  
  // If we seem to be on the research page, monitor for a while
  if (agentProgressSection > 0 || liveBriefingSection > 0 || backButton > 0) {
    console.log('14. Appears to be on research page, monitoring for 30 seconds...');
    
    for (let i = 0; i < 30; i++) {
      const logCount = await page.locator('.custom-scrollbar div').count();
      console.log(`15.${i+1}. Log entries: ${logCount}`);
      
      // Check for report content
      const reportExists = await page.locator('.markdown-content').count() > 0;
      if (reportExists) {
        const reportText = await page.locator('.markdown-content').textContent();
        console.log(`15.${i+1}. Report content detected, length: ${reportText?.length || 0}`);
      }
      
      // Check for errors
      const errorCount = await page.locator('text=Error').count();
      if (errorCount > 0) {
        console.log(`15.${i+1}. Error detected`);
      }
      
      await page.waitForTimeout(1000);
    }
  } else {
    console.log('14. Does not appear to be on research page');
  }
  
  console.log('=== DETAILED PRODUCTION TEST COMPLETED ===');
});