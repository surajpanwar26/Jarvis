// Manual test to debug report generation issues
async function testReportGeneration() {
  console.log('=== MANUAL REPORT GENERATION TEST ===');
  
  try {
    // Test 1: Check if frontend can reach backend
    console.log('\n1. Testing frontend-backend connectivity...');
    const healthResponse = await fetch('http://localhost:8002/health');
    const healthData = await healthResponse.json();
    console.log('Backend health:', healthData);
    
    // Test 2: Test search functionality
    console.log('\n2. Testing search functionality...');
    const searchResponse = await fetch('http://localhost:8002/api/duckduckgo/search?query=Machine+Learning+Basics');
    const searchData = await searchResponse.json();
    console.log('Search result keys:', Object.keys(searchData));
    console.log('Search result answer length:', searchData.answer?.length || 0);
    console.log('Search result results count:', searchData.results?.length || 0);
    
    // Test 3: Test LLM generation
    console.log('\n3. Testing LLM generation...');
    const llmResponse = await fetch('http://localhost:8002/api/llm/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Summarize this topic in one paragraph: Machine Learning Basics',
        system_instruction: 'You are a helpful research assistant.',
        json_mode: false
      })
    });
    
    if (llmResponse.ok) {
      const llmData = await llmResponse.json();
      console.log('LLM response received');
      console.log('Content length:', llmData.content?.length || 0);
      console.log('Provider used:', llmData.provider);
    } else {
      console.log('LLM generation failed with status:', llmResponse.status);
      const errorText = await llmResponse.text();
      console.log('Error details:', errorText);
    }
    
    console.log('\n=== TEST COMPLETED ===');
    
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testReportGeneration();