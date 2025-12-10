import { test, expect } from '@playwright/test';

test('Test Production Deployment', async ({ page }) => {
  console.log('=== PRODUCTION DEPLOYMENT TEST ===');
  
  // Listen for console messages
  page.on('console', msg => {
    console.log(`Browser Console [${msg.type()}]: ${msg.text()}`);
  });
  
  // Listen for page errors
  page.on('pageerror', error => {
    console.log(`Page Error: ${error.message}`);
  });
  
  // Navigate to the production deployment
  await page.goto('https://jarvis-l8gx.onrender.com');
  await page.waitForLoadState('networkidle');
  
  console.log('1. Production site loaded');
  
  // Take initial screenshot
  await page.screenshot({ path: 'test-results/prod-01-homepage.png', fullPage: true });
  
  // Check if we're on the home page
  const jarvisTitle = await page.locator('text=JARVIS').first();
  const isVisible = await jarvisTitle.isVisible();
  console.log('2. JARVIS title visible:', isVisible);
  
  // Fill the input
  await page.fill('input[placeholder="Quick search..."]', 'Machine Learning Basics');
  console.log('3. Filled search input');
  
  // Click the search button
  await page.getByRole('button', { name: 'SEARCH', exact: true }).click();
  console.log('4. Clicked search button');
  
  // Wait and check what happened
  await page.waitForTimeout(3000);
  
  // Take screenshot after clicking search
  await page.screenshot({ path: 'test-results/prod-02-after-search.png', fullPage: true });
  
  // Check if we're on the research page now
  const currentPageHTML = await page.locator('main').innerHTML();
  const isResearchPage = currentPageHTML.includes('Agent Progress') || 
                         currentPageHTML.includes('Live Briefing') ||
                         currentPageHTML.includes('Quick Result');
  
  console.log('5. Is on research page:', isResearchPage);
  
  // If we're on the research page, monitor the progress
  if (isResearchPage) {
    console.log('6. Monitoring research progress...');
    
    // Wait for agent progress section
    try {
      await page.waitForSelector('text=Agent Progress', { timeout: 15000 });
      console.log('7. Agent Progress section found');
      
      // Take screenshot of progress section
      await page.screenshot({ path: 'test-results/prod-03-progress-section.png', fullPage: true });
      
      // Monitor logs for a while
      for (let i = 0; i < 30; i++) {
        const logCount = await page.locator('.custom-scrollbar div').count();
        console.log(`8.${i+1}. Log entries: ${logCount}`);
        
        // Check for report content
        const reportExists = await page.locator('.markdown-content').count() > 0;
        if (reportExists) {
          const reportText = await page.locator('.markdown-content').textContent();
          console.log(`8.${i+1}. Report content detected, length: ${reportText?.length || 0}`);
        }
        
        // Check for errors
        const errorCount = await page.locator('text=Error').count();
        if (errorCount > 0) {
          console.log(`8.${i+1}. Error detected`);
        }
        
        await page.waitForTimeout(1000);
      }
      
      // Final check
      const finalLogCount = await page.locator('.custom-scrollbar div').count();
      const finalReportExists = await page.locator('.markdown-content').count() > 0;
      const finalErrorCount = await page.locator('text=Error').count();
      
      console.log('9. Final status:');
      console.log('    Log entries:', finalLogCount);
      console.log('    Report exists:', finalReportExists);
      console.log('    Error count:', finalErrorCount);
      
      // Take final screenshot
      await page.screenshot({ path: 'test-results/prod-04-final-status.png', fullPage: true });
      
    } catch (error: any) {
      console.log('7. Agent Progress section not found:', error.message);
      await page.screenshot({ path: 'test-results/prod-03-no-progress-section.png', fullPage: true });
    }
  } else {
    console.log('6. Still on homepage or unknown page');
    // Check for any error messages on the page
    const pageText = await page.textContent('body');
    console.log('6. Page text:', pageText?.substring(0, 500));
  }
  
  console.log('=== PRODUCTION DEPLOYMENT TEST COMPLETED ===');
});