import React from 'react';

interface WaveLoaderProps {
  message?: string;
}

export const WaveLoader: React.FC<WaveLoaderProps> = ({ message = "Generating Report..." }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="flex items-end justify-center space-x-1 h-16 mb-4">
        <div className="w-3 bg-gradient-to-t from-cyan-500 to-blue-500 rounded-t-full animate-elastic-bounce-dot1" />
        <div className="w-3 bg-gradient-to-t from-cyan-500 to-blue-500 rounded-t-full animate-elastic-bounce-dot2" />
        <div className="w-3 bg-gradient-to-t from-cyan-500 to-blue-500 rounded-t-full animate-elastic-bounce-dot3" />
      </div>
      <p className="text-cyan-400 font-mono text-sm tracking-wider animate-pulse">
        {message}
      </p>
    </div>
  );
};