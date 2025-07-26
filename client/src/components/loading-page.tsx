import { useState, useEffect } from "react";
import logoImage from "@assets/file_00000000fe2861f5a8308fe4bd6247b6_1753525054263.png";

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
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(message);

  const loadingMessages = [
    "Initializing AI models...",
    "Preparing visual elements...",
    "Setting up workspace...",
    "Almost ready..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 1;
        
        // Update message based on progress
        if (newProgress === 25) setCurrentMessage(loadingMessages[0]);
        else if (newProgress === 50) setCurrentMessage(loadingMessages[1]);
        else if (newProgress === 75) setCurrentMessage(loadingMessages[2]);
        else if (newProgress === 95) setCurrentMessage(loadingMessages[3]);
        
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => onComplete?.(), 500);
        }
        
        return Math.min(newProgress, 100);
      });
    }, duration / 100);

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center z-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      {/* Animated Background Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-40 right-10 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-32 h-32 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="relative text-center">
        {/* Main Logo with Flower Rotation */}
        <div className="mb-12 flex justify-center">
          <div className="relative">
            {/* Outer rotating ring */}
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-gradient-to-r from-blue-400 to-purple-400 opacity-30 animate-spin-slow absolute -inset-4"></div>
            
            {/* Middle rotating ring */}
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-2 border-gradient-to-r from-purple-400 to-pink-400 opacity-50 animate-spin-reverse absolute -inset-2"></div>
            
            {/* Main logo container with flower-like rotation */}
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-full shadow-2xl p-4 animate-flower-bloom">
              <div className="w-full h-full logo-glow animate-flower-spin">
                <img 
                  src={logoImage} 
                  alt="NoteGPT" 
                  className="w-full h-full object-contain"
                />
              </div>
              
              {/* Petal-like elements */}
              <div className="absolute -inset-6 pointer-events-none">
                <div className="absolute top-0 left-1/2 w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full transform -translate-x-1/2 animate-petal-1 opacity-60"></div>
                <div className="absolute top-1/4 right-0 w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-petal-2 opacity-60"></div>
                <div className="absolute bottom-1/4 right-0 w-3 h-3 bg-gradient-to-r from-pink-400 to-red-400 rounded-full animate-petal-3 opacity-60"></div>
                <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-gradient-to-r from-red-400 to-orange-400 rounded-full transform -translate-x-1/2 animate-petal-4 opacity-60"></div>
                <div className="absolute bottom-1/4 left-0 w-3 h-3 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full animate-petal-5 opacity-60"></div>
                <div className="absolute top-1/4 left-0 w-2 h-2 bg-gradient-to-r from-yellow-400 to-green-400 rounded-full animate-petal-6 opacity-60"></div>
              </div>
            </div>
            
            {/* Glow effect */}
            <div className="absolute -inset-8 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 rounded-full blur-2xl opacity-20 animate-pulse"></div>
          </div>
        </div>

        {/* Brand Text */}
        <div className="mb-8">
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
            NoteGPT
          </h1>
          <div className="flex items-center justify-center space-x-2">
            <p className="font-body text-lg sm:text-xl text-gray-600 dark:text-gray-300 font-medium">
              AI-Powered Note Generation
            </p>
            <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm px-3 py-1 rounded-full font-heading font-bold">
              BETA
            </span>
          </div>
        </div>

        {/* Loading Message */}
        <div className="mb-8">
          <p className="font-body text-xl text-gray-700 dark:text-gray-300 font-medium animate-pulse">
            {currentMessage}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-80 mx-auto">
          <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
          </div>
          <div className="mt-3 flex justify-between text-sm font-body text-gray-500 dark:text-gray-400">
            <span>0%</span>
            <span className="font-semibold">{progress}%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute -top-10 -left-10 w-4 h-4 bg-blue-400 rounded-full animate-float opacity-60"></div>
        <div className="absolute -top-5 -right-8 w-3 h-3 bg-purple-400 rounded-full animate-float-delay opacity-60"></div>
        <div className="absolute -bottom-8 -left-6 w-5 h-5 bg-pink-400 rounded-full animate-float-delay-2 opacity-60"></div>
        <div className="absolute -bottom-10 -right-10 w-3 h-3 bg-cyan-400 rounded-full animate-float opacity-60"></div>
      </div>
    </div>
  );
}