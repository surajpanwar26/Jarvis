# Document Analysis UI and API Testing

This document explains how to test the document analysis feature in JARVIS to ensure reports are properly displayed in the UI.

## Test Files Overview

1. **test_doc_analysis_ui.html** - A standalone HTML page that simulates the document analysis UI
2. **test_doc_analysis_api.html** - A web-based tester for the document analysis API endpoint
3. **test_doc_analysis_endpoint.js** - A Node.js script to test the backend API directly

## Prerequisites

- JARVIS backend server running on `http://localhost:8002`
- Node.js installed (for the JavaScript endpoint test)

## Testing Methods

### 1. UI Simulation Test

Open `test_doc_analysis_ui.html` in a web browser to see how document analysis reports would be displayed in the UI:

1. Open the file directly in your browser
2. Click "Test Report Display" to simulate loading a document analysis report
3. Verify that the report is displayed correctly with proper formatting

### 2. API Endpoint Test (Web-Based)

Open `test_doc_analysis_api.html` in a web browser to test the actual API endpoint:

1. Ensure the JARVIS backend is running
2. Open the file in your browser
3. Click "Test Document Analysis API" to send a request to the backend
4. Verify that:
   - The API responds with a 200 status code
   - A report is returned in the response
   - The report is displayed in the UI
   - Response details are shown in the "API Response Details" section

### 3. API Endpoint Test (Node.js Script)

Run the Node.js script to test the backend API directly:

```bash
node test_doc_analysis_endpoint.js
```

This will:
1. Send a document analysis request to the backend
2. Display the response status and headers
3. Show a preview of the generated report
4. Save the full report to a text file
5. List any sources or images extracted

## What to Verify

When testing document analysis report display, ensure:

1. **Report Content**: The report contains all expected sections (Executive Summary, Key Topics, etc.)
2. **Formatting**: Headings, lists, and paragraphs are properly formatted
3. **Sources**: Any sources are correctly listed
4. **Images**: Any extracted images are properly referenced
5. **UI Display**: The report is displayed in the correct container without requiring additional navigation
6. **Error Handling**: Appropriate messages are shown if analysis fails

## Expected Behavior

- When document analysis succeeds, the full report should be displayed in the report container
- When document analysis fails, a meaningful error message should be shown
- The UI should handle both successful and failed analyses gracefully
- Reports should be displayed immediately without requiring page refresh or additional user actions

## Troubleshooting

If document analysis is not working:

1. Check that the backend server is running on port 8002
2. Verify API keys are properly configured in the `.env` file
3. Check server logs for any error messages
4. Ensure the fallback to local document analysis is working
5. Confirm network connectivity to external APIs (if used)

## Related Files

- `backend/agents/document_analyzer_agent.py` - Main document analysis agent
- `backend/agents/local_document_analyzer.py` - Local document analysis fallback
- `backend/agents/chief_agent.py` - Orchestrates document analysis workflow
- `backend/server.py` - API endpoints for document analysis