import { test, expect } from '@playwright/test';

test('Comprehensive Loading State Analysis', async ({ page }) => {
  console.log("=== COMPREHENSIVE LOADING STATE ANALYSIS ===");
  
  // Navigate to the JARVIS website
  await page.goto('https://jarvis-l8gx.onrender.com');
  
  // Wait for the page to load
  await page.waitForTimeout(5000);
  
  // Fill in research topic
  console.log("Filling in research topic...");
  await page.fill('[placeholder="Quick search..."]', 'comprehensive loading test');
  
  // Get initial page content
  const initialContent = await page.locator('body').innerText();
  console.log("Initial page content length:", initialContent.length);
  
  // Click Quick Research button
  console.log("Clicking Quick Research button...");
  await page.click('button:has-text("Quick Research")');
  
  // Wait and capture content at different intervals
  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(1000);
    const content = await page.locator('body').innerText();
    console.log(`Content after ${i+1}s - length: ${content.length}`);
    
    // Check for specific text that should appear during loading
    const hasPlanning = content.includes('Planning') || content.includes('Analyzing');
    const hasSearching = content.includes('Searching') || content.includes('Executing');
    const hasSynthesizing = content.includes('Synthesizing') || content.includes('Drafting');
    const hasGenerating = content.includes('Generating');
    
    console.log(`  Planning: ${hasPlanning}, Searching: ${hasSearching}, Synthesizing: ${hasSynthesizing}, Generating: ${hasGenerating}`);
    
    // Check for WaveLoader specific text
    const hasWaveLoaderText = content.includes('Generating Quick Briefing');
    console.log(`  WaveLoader text found: ${hasWaveLoaderText}`);
    
    // Check for binary rain
    const hasBinaryOnes = (content.match(/1/g) || []).length;
    const hasBinaryZeros = (content.match(/0/g) || []).length;
    console.log(`  Binary digits - 1s: ${hasBinaryOnes}, 0s: ${hasBinaryZeros}`);
    
    if (hasWaveLoaderText) {
      console.log("✅ WaveLoader text detected!");
      break;
    }
  }
  
  // Take a screenshot
  await page.screenshot({ path: 'comprehensive-loading-analysis.png' });
  console.log("Screenshot saved as comprehensive-loading-analysis.png");
  
  console.log("=== COMPREHENSIVE LOADING STATE ANALYSIS COMPLETED ===");
});