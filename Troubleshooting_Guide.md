## 16. Troubleshooting Guide

### 16.1 Common Authentication Issues

#### Issue: "Redirect URI Mismatch" Error
**Symptoms**: Users see "Error 400: redirect_uri_mismatch" when trying to log in
**Solution**:
1. Verify Google Cloud Console OAuth 2.0 Client settings
2. Ensure both development and production redirect URIs are registered:
   - Development: `http://localhost:3000/api/auth/google/callback`
   - Production: `https://jarvis-backend-nzcg.onrender.com/api/auth/google/callback`
3. Restart the application after making changes

#### Issue: "Access Blocked: Invalid Request" Error
**Symptoms**: Users see "Access blocked: This app's request is invalid" after selecting account
**Solution**:
1. Check that the redirect URI in the OAuth flow matches exactly with registered URIs
2. Ensure the `prompt=select_account` parameter is included in authorization requests
3. Verify that the OAuth client credentials are correct

#### Issue: Session Not Persisting After Login
**Symptoms**: Users are redirected back to login page after successful authentication
**Solution**:
1. Check that `SESSION_SECRET_KEY` is properly configured in environment variables
2. Verify that cookies are not being blocked by browser settings
3. Ensure CORS configuration allows credentials

### 16.2 LLM and API Issues

#### Issue: "Report Generation Failed" Errors
**Symptoms**: Users see "Report Generation Failed: Gemini Generation Failed: Failed to fetch"
**Solution**:
1. Verify all API keys are correctly configured in Render environment variables:
   - `GOOGLE_API_KEY`
   - `GROQ_API_KEY`
   - `TAVILY_API_KEY`
   - `HUGGINGFACE_API_KEY`
2. Check that API keys have proper permissions and quotas
3. Test fallback mechanisms by temporarily disabling primary provider

#### Issue: Slow Response Times
**Symptoms**: Long delays in research completion or chat responses
**Solution**:
1. Check network connectivity to API providers
2. Monitor API usage quotas and rate limits
3. Consider implementing caching for frequently requested topics
4. Optimize search queries to reduce processing time

#### Issue: Empty or Incomplete Reports
**Symptoms**: Generated reports lack content or are significantly shorter than expected
**Solution**:
1. Verify search providers are returning adequate results
2. Check that sufficient context is being gathered before report generation
3. Review LLM prompts to ensure they're requesting comprehensive content
4. Increase token limits for report generation

### 16.3 Frontend Issues

#### Issue: UI Not Loading Properly
**Symptoms**: Blank pages, missing components, or styling issues
**Solution**:
1. Check browser console for JavaScript errors
2. Verify all environment variables are correctly configured
3. Ensure API endpoints are accessible and responding correctly
4. Clear browser cache and reload the application

#### Issue: File Upload Not Working
**Symptoms**: Document analysis fails to start or shows errors
**Solution**:
1. Check file size limits and supported formats
2. Verify that the backend can receive and process file uploads
3. Ensure proper MIME type detection
4. Check for network issues during file transfer

#### Issue: Real-time Updates Not Working
**Symptoms**: Agent activity logs don't update in real-time during research
**Solution**:
1. Verify event emission from backend agents
2. Check frontend event listeners are properly subscribed
3. Ensure WebSocket connections (if used) are established
4. Review browser console for errors related to event handling

### 16.4 Database Issues

#### Issue: Activity Logs Not Saving
**Symptoms**: User history is empty or not updating
**Solution**:
1. Verify MongoDB connection string is correct
2. Check that database credentials have proper permissions
3. Ensure the application can establish a connection to MongoDB
4. Review database logs for errors

#### Issue: User Data Not Persisting
**Symptoms**: User preferences or settings are lost between sessions
**Solution**:
1. Check that user data is being properly saved to the database
2. Verify that user IDs are being correctly tracked
3. Ensure database operations are not failing silently
4. Review data retention policies

### 16.5 Deployment Issues

#### Issue: Application Not Starting on Render
**Symptoms**: Build failures or application crashes on deployment
**Solution**:
1. Check build logs for dependency installation errors
2. Verify that all required environment variables are set
3. Ensure the start command is correctly configured in `render.yaml`
4. Check that ports are correctly configured

#### Issue: CORS Errors in Production
**Symptoms**: Frontend cannot communicate with backend API
**Solution**:
1. Verify `CORS_ORIGINS` environment variable includes production frontend URL
2. Check that `FRONTEND_URL` is correctly set
3. Ensure both frontend and backend are using HTTPS in production
4. Review browser console for specific CORS error messages