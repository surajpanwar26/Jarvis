// In Vite (local development), keys are exposed via import.meta.env
// We prioritize this for local builds.

export const getEnv = (key: string): string | undefined => {
  let val: string | undefined = undefined;

  // 1. Try Vite standard (import.meta.env) - check for VITE_ prefixed variables first
  try {
    // @ts-ignore
    if (import.meta.env && import.meta.env[`VITE_${key}`]) {
      // @ts-ignore
      val = import.meta.env[`VITE_${key}`];
    }
    // @ts-ignore
    else if (import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      val = import.meta.env[key];
    }
  } catch (e) {
    // ignore
  }

  // 2. Try Node/Process standard (Fallback)
  if (!val && typeof process !== 'undefined' && process.env) {
    val = process.env[`VITE_${key}`] || process.env[key] || process.env[`REACT_APP_${key}`];
  }

  // Clean value (remove quotes if user added them in .env text file)
  if (val) {
    return val.replace(/["']/g, "").trim();
  }

  return undefined;
};

export const config = {
  groqApiKey: getEnv('GROQ_API_KEY'),
  tavilyApiKey: getEnv('TAVILY_API_KEY'),
  huggingFaceApiKey: getEnv('HUGGINGFACE_API_KEY'),
  unsplashAccessKey: getEnv('UNSPLASH_ACCESS_KEY'),
  pexelsApiKey: getEnv('PEXELS_API_KEY'),
  // Support both standard names for Google Key
  googleApiKey: getEnv('GOOGLE_API_KEY') || getEnv('API_KEY'),
  // API URL configuration - prioritize VITE_API_URL, then REACT_APP_API_URL, then API_URL
  apiUrl: getEnv('VITE_API_URL') || getEnv('REACT_APP_API_URL') || getEnv('API_URL'),
  // API Endpoint URLs
  tavilyApiUrl: getEnv('VITE_TAVILY_API_URL') || getEnv('TAVILY_API_URL'),
  pexelsApiUrl: getEnv('VITE_PEXELS_API_URL') || getEnv('PEXELS_API_URL'),
  unsplashApiUrl: getEnv('VITE_UNSPLASH_API_URL') || getEnv('UNSPLASH_API_URL'),
};

// Debug helper to print status to console
export const logConfigStatus = () => {
  console.log("--- JARVIS API CONFIG STATUS ---");
  console.log("Groq Key:", config.groqApiKey ? "✅ Loaded" : "❌ Missing");
  console.log("Google Key:", config.googleApiKey ? "✅ Loaded" : "❌ Missing");
  console.log("Tavily Key:", config.tavilyApiKey ? "✅ Loaded" : "❌ Missing");
  console.log("API URL:", config.apiUrl ? config.apiUrl : "⚠️  Not set - will use default");
  console.log("--------------------------------");
};

export const hasKey = (key: string | undefined): boolean => !!key && key.length > 0;

// Utility function to get the base API URL
export const getApiBaseUrl = (): string => {
  // Use the configured API URL if available
  if (config.apiUrl) {
    return config.apiUrl;
  }
  
  // In development, fallback to localhost:8002
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return `http://localhost:${process.env.PORT || 8002}`;
  }
  
  // For production, use the Render backend URL
  if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
    return 'https://jarvis-backend-nzcg.onrender.com';
  }
  
  // For production, use a more appropriate default
  console.warn("No API URL configured, using localhost as fallback");
  return `http://localhost:${process.env.PORT || 8002}`;
};

// Utility function to get the full API URL
export const getApiUrl = (endpoint: string = ''): string => {
  const baseUrl = getApiBaseUrl();
  // Ensure endpoint starts with '/' but doesn't double up
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${formattedEndpoint}`;
};