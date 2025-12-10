import { test, expect } from '@playwright/test';

test('Monitor Console for Errors', async ({ page }) => {
  console.log('=== CONSOLE ERROR MONITORING ===');
  
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
  
  // Navigate to the application
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  
  console.log('1. Home page loaded');
  
  // Fill the input
  await page.fill('input[placeholder="Quick search..."]', 'Machine Learning Basics');
  console.log('2. Filled search input');
  
  // Click the search button
  await page.getByRole('button', { name: 'SEARCH', exact: true }).click();
  console.log('3. Clicked search button');
  
  // Wait to see if any errors occur
  await page.waitForTimeout(5000);
  
  console.log('=== CONSOLE ERROR MONITORING COMPLETED ===');
});