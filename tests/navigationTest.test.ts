import { test, expect } from '@playwright/test';

test('Debug Navigation Issue', async ({ page }) => {
  console.log('=== DEBUG NAVIGATION ISSUE ===');
  
  // Navigate to the application
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  
  console.log('1. Home page loaded');
  
  // Click Quick Research tab
  await page.click('button:has-text("Quick Research")');
  console.log('2. Clicked Quick Research tab');
  
  // Enter search query
  await page.fill('input[placeholder="Quick search..."]', 'Machine Learning Basics');
  console.log('3. Entered search query');
  
  // Get the search button and examine it
  const searchButton = page.getByRole('button', { name: 'SEARCH', exact: true });
  const isVisible = await searchButton.isVisible();
  const isEnabled = await searchButton.isEnabled();
  
  console.log('4. Search button visibility:', isVisible);
  console.log('5. Search button enabled:', isEnabled);
  
  // Get button attributes
  const buttonText = await searchButton.textContent();
  const buttonClasses = await searchButton.getAttribute('class');
  
  console.log('6. Button text:', buttonText);
  console.log('7. Button classes:', buttonClasses);
  
  // Click search button
  await searchButton.click();
  console.log('8. Clicked SEARCH button');
  
  // Wait a bit
  await page.waitForTimeout(1000);
  
  // Check current URL
  const currentUrl = page.url();
  console.log('11. Current URL:', currentUrl);
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/navigation-debug.png', fullPage: true });
  
  console.log('=== NAVIGATION DEBUG COMPLETED ===');
});