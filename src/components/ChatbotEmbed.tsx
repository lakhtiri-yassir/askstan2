import React, { useEffect, useRef, useState } from 'react';
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

  useEffect(() => {
    if (!containerRef.current) return;

    const loadChatbot = async () => {
      try {
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
          const styleElement = document.createElement('style');
          styleElement.textContent = config.customStyles;
          document.head.appendChild(styleElement);
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

        // Insert embed code
        container.innerHTML = config.embedCode;

        // Execute initialization script if provided
        if (config.initializationScript) {
          // Create a script element and execute it
          const scriptElement = document.createElement('script');
          scriptElement.textContent = config.initializationScript;
          container.appendChild(scriptElement);
        }

        // Wait a moment for chatbot to initialize
        setTimeout(() => {
          setIsLoading(false);
          config.onLoad?.();
          onLoad?.();
        }, 1000);

      } catch (error) {
        console.error('Chatbot loading error:', error);
        setHasError(true);
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load chatbot');
        setIsLoading(false);
        
        const errorObj = error instanceof Error ? error : new Error('Unknown error');
        onError?.(errorObj);
      }
    };

    loadChatbot();
  }, [user, profile, subscription, onLoad, onError]);

  const handleRetry = () => {
    setHasError(false);
    setErrorMessage('');
    // Trigger reload by changing a dependency
    const event = new CustomEvent('chatbot-reload');
    window.dispatchEvent(event);
  };

  if (hasError) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-xl ${className}`}>
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Chatbot Loading Error</h3>
        <p className="text-red-600 text-center mb-4 max-w-md">
          {errorMessage || 'There was an error loading the chatbot. Please try again.'}
        </p>
        <button
          onClick={handleRetry}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl z-10">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 font-medium">Loading your AI coach...</p>
          </div>
        </div>
      )}
      
      {/* Chatbot container */}
      <div
        ref={containerRef}
        className="chatbot-container w-full"
        style={{ minHeight: '500px' }}
      />
    </div>
  );
};

export default ChatbotEmbed;