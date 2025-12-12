import { test, expect } from '@playwright/test';

test('Detailed Page Structure Inspection', async ({ page }) => {
  console.log("=== DETAILED PAGE STRUCTURE INSPECTION ===");
  
  // Navigate to the JARVIS website
  await page.goto('https://jarvis-l8gx.onrender.com');
  
  // Wait for the page to load
  await page.waitForTimeout(5000);
  
  // Check page title
  const title = await page.title();
  console.log(`Page title: ${title}`);
  
  // List all input fields
  const inputFields = await page.$$('input');
  console.log(`Total input fields: ${inputFields.length}`);
  
  for (let i = 0; i < inputFields.length; i++) {
    const input = inputFields[i];
    const placeholder = await input.getAttribute('placeholder');
    const type = await input.getAttribute('type');
    const id = await input.getAttribute('id');
    const className = await input.getAttribute('class');
    console.log(`Input ${i+1}: placeholder="${placeholder}", type="${type}", id="${id}", class="${className}"`);
  }
  
  // List all buttons
  const buttons = await page.$$('button');
  console.log(`Total buttons: ${buttons.length}`);
  
  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    const text = await button.textContent();
    const className = await button.getAttribute('class');
    console.log(`Button ${i+1}: text="${text.trim()}", class="${className}"`);
  }
  
  // Try to find the research input field by different selectors
  console.log("=== TESTING DIFFERENT SELECTORS FOR INPUT FIELD ===");
  
  const selectorsToTry = [
    '[placeholder*="research"]',
    '[placeholder*="Research"]',
    '[placeholder*="topic"]',
    '[placeholder*="Topic"]',
    'input[type="text"]',
    '#topic-input',
    '.research-input',
    '[class*="input"]',
    '[class*="search"]'
  ];
  
  for (const selector of selectorsToTry) {
    const count = await page.locator(selector).count();
    console.log(`Selector "${selector}": ${count} elements found`);
    if (count > 0) {
      const element = await page.locator(selector).first();
      const placeholder = await element.getAttribute('placeholder');
      console.log(`  First element placeholder: "${placeholder}"`);
    }
  }
  
  // Check if there are any visible errors or warnings
  const errorSelectors = [
    'text=error',
    'text=failed',
    'text=exception',
    'text=warning',
    '[class*="error"]',
    '[class*="warning"]'
  ];
  
  console.log("=== CHECKING FOR ERRORS OR WARNINGS ===");
  for (const selector of errorSelectors) {
    const count = await page.locator(selector).count();
    if (count > 0) {
      console.log(`⚠️  Found ${count} elements matching "${selector}"`);
      // Get text content of first few matching elements
      for (let i = 0; i < Math.min(count, 3); i++) {
        const text = await page.locator(selector).nth(i).textContent();
        console.log(`  Element ${i+1} text: "${text.trim()}"`);
      }
    }
  }
  
  // Take a screenshot for visual inspection
  await page.screenshot({ path: 'detailed-page-inspection.png', fullPage: true });
  console.log("Screenshot saved as detailed-page-inspection.png");
});