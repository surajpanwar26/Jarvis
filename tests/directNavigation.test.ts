import { test, expect } from '@playwright/test';

test('Test Direct Navigation', async ({ page }) => {
  console.log('=== DIRECT NAVIGATION TEST ===');
  
  // Navigate to the application
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  
  console.log('1. Home page loaded');
  
  // Take initial screenshot
  await page.screenshot({ path: 'test-results/direct-01-homepage.png', fullPage: true });
  
  // Examine the page structure to understand navigation
  const homePageElements = await page.locator('main').innerHTML();
  const hasHomePage = homePageElements.includes('Quick Research');
  console.log('2. Has homepage elements:', hasHomePage);
  
  // Try to directly trigger navigation by evaluating JavaScript
  console.log('3. Attempting direct navigation...');
  
  // Inject a script to trigger navigation
  await page.evaluate(() => {
    // Try to find and call the navigate function
    // @ts-ignore
    const appElement = document.querySelector('#root');
    if (appElement) {
      console.log('App element found');
    }
  });
  
  // Alternative approach: Try to trigger the search button click programmatically
  try {
    // Fill the input first
    await page.fill('input[placeholder="Quick search..."]', 'Machine Learning Basics');
    console.log('4. Filled search input');
    
    // Try to click the search button using a more specific selector
    const searchButton = page.locator('button.mx-1\\.5.px-6.py-3');
    const buttonCount = await searchButton.count();
    console.log('5. Found search buttons:', buttonCount);
    
    if (buttonCount > 0) {
      const isVisible = await searchButton.first().isVisible();
      const isEnabled = await searchButton.first().isEnabled();
      console.log('6. Button visible:', isVisible);
      console.log('7. Button enabled:', isEnabled);
      
      if (isVisible && isEnabled) {
        await searchButton.first().click();
        console.log('8. Clicked search button');
      }
    }
    
  } catch (error: any) {
    console.log('Error clicking search button:', error.message);
  }
  
  // Wait and check what happened
  await page.waitForTimeout(2000);
  
  // Check if we're on the research page now
  const currentPageHTML = await page.locator('main').innerHTML();
  const isResearchPage = currentPageHTML.includes('Agent Progress') || 
                         currentPageHTML.includes('Live Briefing') ||
                         currentPageHTML.includes('Quick Result');
  
  console.log('9. Is on research page:', isResearchPage);
  
  // Take screenshot after attempted navigation
  await page.screenshot({ path: 'test-results/direct-02-after-navigation.png', fullPage: true });
  
  // If we're on the research page, monitor the progress
  if (isResearchPage) {
    console.log('10. Monitoring research progress...');
    
    // Wait for agent progress section
    try {
      await page.waitForSelector('text=Agent Progress', { timeout: 10000 });
      console.log('11. Agent Progress section found');
      
      // Monitor logs for a while
      for (let i = 0; i < 20; i++) {
        const logCount = await page.locator('.custom-scrollbar div').count();
        console.log(`12.${i+1}. Log entries: ${logCount}`);
        
        // Check for report content
        const reportExists = await page.locator('.markdown-content').count() > 0;
        if (reportExists) {
          const reportText = await page.locator('.markdown-content').textContent();
          console.log(`12.${i+1}. Report content detected, length: ${reportText?.length || 0}`);
        }
        
        // Check for errors
        const errorCount = await page.locator('text=Error').count();
        if (errorCount > 0) {
          console.log(`12.${i+1}. Error detected`);
        }
        
        await page.waitForTimeout(1000);
      }
    } catch (error: any) {
      console.log('11. Agent Progress section not found:', error.message);
    }
  } else {
    console.log('10. Still on homepage or unknown page');
  }
  
  console.log('=== DIRECT NAVIGATION TEST COMPLETED ===');
});