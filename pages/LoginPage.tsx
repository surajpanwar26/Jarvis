import React from 'react';
import { JarvisLogo } from '../components/Logo';
import { GoogleIcon } from '../components/Icons';

interface LoginPageProps {
  onLogin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const handleGoogleLogin = () => {
    // Open OAuth in a popup window instead of redirecting
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    // Use environment variable for API URL with fallback to localhost
    // @ts-ignore: ImportMeta.env is not properly typed in TypeScript
    const apiUrl = import.meta.env?.VITE_API_URL || `http://localhost:${import.meta.env?.PORT || 8002}`;
    const popup = window.open(
      `${apiUrl}/api/auth/login`,
      'Google Login',
      `width=${width},height=${height},top=${top},left=${left}`
    );
    
    // Poll for popup closure and check for auth token
    const pollTimer = setInterval(() => {
      if (popup?.closed) {
        clearInterval(pollTimer);
        // Check if we got a token
        const token = localStorage.getItem('authToken');
        if (token) {
          onLogin();
        }
      }
    }, 500);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden bg-[#0B0F19]">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
         <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-cyan-600/10 blur-[120px]"></div>
         <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[120px]"></div>
      </div>

      <div className="z-10 w-full max-w-md p-6">
        <div className="glass-card rounded-2xl border border-white/10 p-8 shadow-2xl flex flex-col items-center animate-fade-in relative overflow-hidden">
          
          {/* Subtle Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>

          <div className="mb-8 relative">
            <JarvisLogo size="lg" className="drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]" />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-display text-white mb-2 tracking-tight">Welcome to JARVIS</h1>
            <p className="text-slate-400 font-mono text-sm">AI Research Assistant</p>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 font-bold py-3.5 px-6 rounded-xl hover:bg-slate-100 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg group relative overflow-hidden"
          >
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-200/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
             <GoogleIcon className="w-5 h-5" />
             <span>Continue with Google</span>
          </button>

          <div className="mt-8 text-center">
             <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">Made with ❤️ by Suraj Panwar</p>
          </div>
        </div>
      </div>
    </div>
  );
};