import { test, expect } from '@playwright/test';

test('Test API Connection', async ({ page }) => {
  console.log('=== API CONNECTION TEST ===');
  
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
  
  // Try to directly test the API connection
  console.log('2. Testing API connection...');
  
  const apiTestResult = await page.evaluate(async () => {
    try {
      // Try to make a direct API call to test connectivity
      const response = await fetch('http://localhost:8002/health');
      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        return { success: false, status: response.status, statusText: response.statusText };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
  
  console.log('3. API test result:', JSON.stringify(apiTestResult, null, 2));
  
  // Now try with the configured API URL
  const configApiTestResult = await page.evaluate(async () => {
    try {
      // @ts-ignore
      const config = window.JARVIS_CONFIG || {};
      const apiUrl = config.apiUrl || 'http://localhost:8002';
      
      console.log('Testing API URL:', apiUrl);
      
      const response = await fetch(`${apiUrl}/health`);
      if (response.ok) {
        const data = await response.json();
        return { success: true, data, url: apiUrl };
      } else {
        return { success: false, status: response.status, statusText: response.statusText, url: apiUrl };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
  
  console.log('4. Config API test result:', JSON.stringify(configApiTestResult, null, 2));
  
  console.log('=== API CONNECTION TEST COMPLETED ===');
});