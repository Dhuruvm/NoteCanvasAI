import { useState, useEffect } from "react";
import logoIcon from '@assets/Your_paragraph_text_20250902_153838_0000-removebg-preview_1756807918114.png';

interface LoadingPageProps {
  message?: string;
  onComplete?: () => void;
  duration?: number;
}

export function LoadingPage({ 
  message = "Loading your AI-powered experience...", 
  onComplete, 
  duration = 3000 
}: LoadingPageProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="text-center">
        {/* Logo and NoteGPT Brand */}
        <div className="flex items-center justify-center mb-6">
          <img 
            src={logoIcon} 
            alt="NoteGPT Logo" 
            className="w-16 h-16 mr-4 animate-pulse"
          />
          <h1 className="text-6xl md:text-8xl font-bold text-white animate-pulse">
            NoteGPT
          </h1>
        </div>
        
        {/* Loading Message */}
        <p className="text-xl text-gray-400 mb-8">{message}</p>
        
        {/* Loading animation circles */}
        <div className="flex justify-center space-x-2">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
          <div className="w-3 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}