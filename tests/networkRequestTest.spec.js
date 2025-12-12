import { test, expect } from '@playwright/test';

test('Network Request Monitoring Test', async ({ page }) => {
  console.log("=== NETWORK REQUEST MONITORING TEST ===");
  
  // Enable request interception to monitor network requests
  const requests = [];
  const responses = [];
  
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers()
    });
    console.log(`→ Request: ${request.method()} ${request.url()}`);
  });
  
  page.on('response', response => {
    responses.push({
      url: response.url(),
      status: response.status(),
      headers: response.headers()
    });
    console.log(`← Response: ${response.status()} ${response.url()}`);
  });
  
  // Navigate to the JARVIS website
  await page.goto('https://jarvis-l8gx.onrender.com');
  
  // Wait for the page to load
  await page.waitForTimeout(5000);
  
  // Clear previous requests
  requests.length = 0;
  responses.length = 0;
  
  // Fill in research topic
  console.log("Filling in research topic...");
  await page.fill('[placeholder="Quick search..."]', 'artificial intelligence');
  
  // Click Quick Research button
  console.log("Clicking Quick Research button...");
  await page.click('button:has-text("Quick Research")');
  
  // Wait and observe network requests
  console.log("Monitoring network requests for 30 seconds...");
  await page.waitForTimeout(30000);
  
  // Report network activity
  console.log(`Total requests captured: ${requests.length}`);
  console.log(`Total responses captured: ${responses.length}`);
  
  // Look for API requests to the backend
  const apiRequests = requests.filter(req => req.url.includes('api') || req.url.includes('render.com'));
  const apiResponses = responses.filter(res => res.url.includes('api') || res.url.includes('render.com'));
  
  console.log(`API requests: ${apiRequests.length}`);
  console.log(`API responses: ${apiResponses.length}`);
  
  // Check for any failed requests (4xx or 5xx)
  const failedResponses = responses.filter(res => res.status >= 400);
  console.log(`Failed responses (4xx/5xx): ${failedResponses.length}`);
  
  if (failedResponses.length > 0) {
    console.log("❌ Failed responses detected:");
    failedResponses.slice(0, 5).forEach((res, index) => {
      console.log(`  ${index + 1}. ${res.status} ${res.url}`);
    });
  } else {
    console.log("✅ No failed responses detected");
  }
  
  // Take a screenshot
  await page.screenshot({ path: 'network-monitoring-test.png', fullPage: true });
  console.log("Screenshot saved as network-monitoring-test.png");
  
  // Summary
  if (apiRequests.length > 0) {
    console.log("✅ API requests are being made to the backend");
  } else {
    console.log("⚠️ No API requests detected - possible connection issue");
  }
});