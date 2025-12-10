import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Expose only specific env vars to process.env for compatibility
      'process.env.REACT_APP_API_URL': JSON.stringify(env.REACT_APP_API_URL || env.VITE_API_URL),
      'process.env.API_URL': JSON.stringify(env.API_URL || env.VITE_API_URL || env.REACT_APP_API_URL),
      'process.env.NODE_ENV': JSON.stringify(mode),
      // Add other specific environment variables as needed
    }
  }
})