import { test, expect } from '@playwright/test';

test('Debug UI Report Generation Flow', async ({ page }) => {
  console.log('=== STARTING UI DEBUG TEST ===');
  
  // Navigate to the application
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  
  console.log('1. Home page loaded');
  
  // Take initial screenshot
  await page.screenshot({ path: 'test-results/01-homepage.png', fullPage: true });
  
  // Click Quick Research tab
  await page.click('button:has-text("Quick Research")');
  console.log('2. Clicked Quick Research tab');
  
  // Enter search query
  await page.fill('input[placeholder="Quick search..."]', 'Machine Learning Basics');
  console.log('3. Entered search query');
  
  // Take screenshot before clicking search
  await page.screenshot({ path: 'test-results/02-before-search.png', fullPage: true });
  
  // Click search button
  await page.getByRole('button', { name: 'SEARCH', exact: true }).click();
  console.log('4. Clicked SEARCH button');
  
  // Wait for navigation and take screenshot
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-results/03-after-search-click.png', fullPage: true });
  
  // Check current URL
  const currentUrl = page.url();
  console.log('5. Current URL:', currentUrl);
  
  // Check if we're on the quick result page
  const isQuickResultPage = currentUrl.includes('QUICK_RESULT');
  console.log('6. Is on Quick Result page:', isQuickResultPage);
  
  if (isQuickResultPage) {
    console.log('7. On Quick Result page, monitoring progress...');
    
    // Wait for agent progress section
    try {
      await page.waitForSelector('text=Agent Progress', { timeout: 5000 });
      console.log('8. Agent Progress section found');
      
      // Take screenshot of progress section
      await page.screenshot({ path: 'test-results/04-progress-section.png', fullPage: true });
      
      // Monitor logs for 30 seconds
      console.log('9. Monitoring logs for 30 seconds...');
      let logCount = 0;
      
      for (let i = 0; i < 30; i++) {
        // Count log entries
        const newLogCount = await page.locator('.custom-scrollbar div').count();
        if (newLogCount > logCount) {
          console.log(`9.${i+1}. New log entries detected: ${newLogCount - logCount}`);
          logCount = newLogCount;
          
          // Print latest log entry
          if (logCount > 0) {
            const latestLog = await page.locator('.custom-scrollbar div').nth(logCount - 1).textContent();
            console.log(`     Latest log: ${latestLog}`);
          }
        }
        
        // Check for report content
        const reportExists = await page.locator('.markdown-content').count() > 0;
        if (reportExists) {
          const reportText = await page.locator('.markdown-content').textContent();
          console.log(`9.${i+1}. Report content detected, length: ${reportText?.length || 0}`);
          break;
        }
        
        // Check for error messages
        const errorCount = await page.locator('text=Error').count();
        if (errorCount > 0) {
          console.log(`9.${i+1}. Error detected`);
          break;
        }
        
        // Wait 1 second
        await page.waitForTimeout(1000);
      }
      
      // Final check
      const finalLogCount = await page.locator('.custom-scrollbar div').count();
      const finalReportExists = await page.locator('.markdown-content').count() > 0;
      const finalErrorCount = await page.locator('text=Error').count();
      
      console.log('10. Final status:');
      console.log('    Log entries:', finalLogCount);
      console.log('    Report exists:', finalReportExists);
      console.log('    Error count:', finalErrorCount);
      
      // Take final screenshot
      await page.screenshot({ path: 'test-results/05-final-status.png', fullPage: true });
      
    } catch (error: any) {
      console.log('8. Agent Progress section not found:', error.message);
      await page.screenshot({ path: 'test-results/04-no-progress-section.png', fullPage: true });
    }
  } else {
    console.log('7. Not on expected page, taking screenshot');
    await page.screenshot({ path: 'test-results/04-unexpected-page.png', fullPage: true });
  }
  
  console.log('=== UI DEBUG TEST COMPLETED ===');
});