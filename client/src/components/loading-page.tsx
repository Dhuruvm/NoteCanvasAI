import { useState, useEffect } from "react";

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
        {/* Simple Central NoteGPT Logo with Animation */}
        <div className="relative">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-4 animate-pulse">
            <span className="inline-block animate-bounce" style={{ animationDelay: '0s' }}>N</span>
            <span className="inline-block animate-bounce" style={{ animationDelay: '0.1s' }}>o</span>
            <span className="inline-block animate-bounce" style={{ animationDelay: '0.2s' }}>t</span>
            <span className="inline-block animate-bounce" style={{ animationDelay: '0.3s' }}>e</span>
            <span className="inline-block animate-bounce" style={{ animationDelay: '0.4s' }}>G</span>
            <span className="inline-block animate-bounce" style={{ animationDelay: '0.5s' }}>P</span>
            <span className="inline-block animate-bounce" style={{ animationDelay: '0.6s' }}>T</span>
          </h1>
          
          {/* Loading animation circles */}
          <div className="flex justify-center space-x-2 mt-8">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
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