// In Vite (local development), keys are exposed via import.meta.env
// We prioritize this for local builds.

const getEnv = (key: string): string | undefined => {
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
  // API URL configuration
  apiUrl: getEnv('API_URL') || getEnv('REACT_APP_API_URL') || getEnv('VITE_API_URL'),
};

// Debug helper to print status to console
export const logConfigStatus = () => {
  console.log("--- JARVIS API CONFIG STATUS ---");
  console.log("Groq Key:", config.groqApiKey ? "✅ Loaded" : "❌ Missing");
  console.log("Google Key:", config.googleApiKey ? "✅ Loaded" : "❌ Missing");
  console.log("Tavily Key:", config.tavilyApiKey ? "✅ Loaded" : "❌ Missing");
  console.log("API URL:", config.apiUrl ? config.apiUrl : `⚠️ Using default (localhost:${process.env.PORT || 8002})`);
  console.log("--------------------------------");
};

export const hasKey = (key: string | undefined): boolean => !!key && key.length > 0;

// Utility function to get the base API URL
export const getApiBaseUrl = (): string => {
  // In production, this should be set via environment variables
  // In development, fallback to localhost:8002
  // In production, this should be set via REACT_APP_API_URL environment variable
  return config.apiUrl || (typeof window !== 'undefined' ? '' : `http://localhost:${process.env.PORT || 8002}`);
};

// Utility function to get the full API URL
export const getApiUrl = (endpoint: string = ''): string => {
  const baseUrl = getApiBaseUrl();
  // Ensure endpoint starts with '/' but doesn't double up
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${formattedEndpoint}`;
};