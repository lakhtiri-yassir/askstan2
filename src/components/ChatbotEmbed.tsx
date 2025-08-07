import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getChatbotConfig, ChatbotConfig } from '../config/chatbot.config';

interface ChatbotEmbedProps {
  className?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export const ChatbotEmbed: React.FC<ChatbotEmbedProps> = ({
  className = '',
  onLoad,
  onError
}) => {
  const { user, profile, subscription } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [initAttempts, setInitAttempts] = useState(0);
  const maxInitAttempts = 3;

  // FIXED: Memoized chatbot loading function to prevent infinite re-runs
  const loadChatbot = useCallback(async () => {
    if (!containerRef.current) {
      console.log('⚠️  Container ref not ready, skipping load');
      return;
    }

    try {
      console.log(`🚀 Loading chatbot (attempt ${initAttempts + 1}/${maxInitAttempts})`);
      setIsLoading(true);
      setHasError(false);

      // Get chatbot configuration
      const config: ChatbotConfig = getChatbotConfig({
        id: user?.id,
        email: user?.email,
        subscription: subscription
      });

      // Clear container
      containerRef.current!.innerHTML = '';

      // Apply custom styles if provided
      if (config.customStyles) {
        // Check if styles already added to prevent duplicates
        if (!document.querySelector('#chatbot-custom-styles')) {
          const styleElement = document.createElement('style');
          styleElement.id = 'chatbot-custom-styles';
          styleElement.textContent = config.customStyles;
          document.head.appendChild(styleElement);
        }
      }

      // Apply container settings
      const container = containerRef.current!;
      Object.assign(container.style, {
        width: config.containerSettings.width,
        height: config.containerSettings.height,
        borderRadius: config.containerSettings.borderRadius,
        boxShadow: config.containerSettings.boxShadow,
        backgroundColor: config.containerSettings.backgroundColor,
        overflow: 'hidden'
      });

      // Insert embed code (placeholder for Voiceflow)
      container.innerHTML = config.embedCode;

      // FIXED: Execute initialization script globally, not in container
      if (config.initializationScript) {
        console.log('📜 Executing initialization script globally...');
        
        // Create script element and append to document head (not container)
        const scriptElement = document.createElement('script');
        scriptElement.textContent = config.initializationScript;
        scriptElement.id = `chatbot-init-${Date.now()}`;
        
        // Remove any existing initialization scripts
        const existingScript = document.querySelector('script[id^="chatbot-init-"]');
        if (existingScript) {
          existingScript.remove();
        }
        
        document.head.appendChild(scriptElement);
      }

      // FIXED: Better timeout handling with success detection
      const checkChatbotLoaded = () => {
        // Check if Voiceflow widget is present and visible
        const voiceflowWidget = document.querySelector('[class*="vfrc-"]');
        const placeholder = document.getElementById('voiceflow-placeholder');
        
        if (voiceflowWidget && voiceflowWidget.offsetHeight > 0) {
          console.log('✅ Voiceflow widget detected and visible');
          setIsLoading(false);
          config.onLoad?.();
          onLoad?.();
          return;
        }
        
        if (placeholder && placeholder.style.display === 'none') {
          console.log('✅ Placeholder hidden, assuming widget loaded');
          setIsLoading(false);
          config.onLoad?.();
          onLoad?.();
          return;
        }
        
        // Keep checking for up to 15 seconds
        if (initAttempts < maxInitAttempts) {
          setTimeout(checkChatbotLoaded, 5000);
        } else {
          console.log('⏰ Timeout waiting for chatbot to load');
          setIsLoading(false);
          config.onLoad?.();
          onLoad?.();
        }
      };

      // Start checking after a short delay
      setTimeout(checkChatbotLoaded, 2000);

    } catch (error) {
      console.error('💥 Chatbot loading error:', error);
      setHasError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load chatbot');
      setIsLoading(false);
      
      const errorObj = error instanceof Error ? error : new Error('Unknown error');
      onError?.(errorObj);
    }
  }, [user, profile, subscription, onLoad, onError, initAttempts]);

  // FIXED: Effect with proper dependencies and cleanup
  useEffect(() => {
    // Only load if we have a container and haven't exceeded max attempts
    if (containerRef.current && initAttempts < maxInitAttempts) {
      const timeoutId = setTimeout(() => {
        loadChatbot();
      }, 1000); // Small delay to ensure container is fully ready

      return () => clearTimeout(timeoutId);
    }
  }, [loadChatbot, initAttempts]);

  // FIXED: Improved retry function with attempt tracking
  const handleRetry = useCallback(() => {
    setHasError(false);
    setErrorMessage('');
    setIsLoading(true);
    setInitAttempts(prev => prev + 1);
  }, []);

  // FIXED: Better error UI with retry limits
  if (hasError || initAttempts >= maxInitAttempts) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-xl ${className}`}>
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          {initAttempts >= maxInitAttempts ? 'Chatbot Loading Timeout' : 'Chatbot Loading Error'}
        </h3>
        <p className="text-red-600 text-center mb-4 max-w-md">
          {initAttempts >= maxInitAttempts 
            ? 'The chatbot is taking longer than expected to load. Please refresh the page or try again later.'
            : (errorMessage || 'There was an error loading the chatbot. Please try again.')
          }
        </p>
        {initAttempts < maxInitAttempts && (
          <button
            onClick={handleRetry}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry ({initAttempts + 1}/{maxInitAttempts})</span>
          </button>
        )}
        {initAttempts >= maxInitAttempts && (
          <button
            onClick={() => window.location.reload()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Page</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* FIXED: Better loading state with timeout indication */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-xl z-10">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 font-medium">Loading your AI coach...</p>
            <p className="text-gray-400 text-sm">
              Attempt {initAttempts + 1} of {maxInitAttempts}
            </p>
          </div>
        </div>
      )}
      
      {/* FIXED: Container with proper minimum height */}
      <div
        ref={containerRef}
        className="chatbot-container w-full"
        style={{ 
          minHeight: '500px',
          position: 'relative',
          zIndex: 1
        }}
      />
      
      {/* FIXED: Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
          <strong>Debug:</strong> Loading: {isLoading ? 'Yes' : 'No'}, Attempts: {initAttempts}, User: {user?.id || 'None'}
        </div>
      )}
    </div>
  );
};

export default ChatbotEmbed;