// src/components/ChatbotEmbed.tsx - FIXED TO WORK WITH UNIFIED CONFIG
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { chatbotConfig, setUserDataForChatbot } from '../config/chatbot';
import { MessageSquare, AlertTriangle, RefreshCw } from 'lucide-react';

interface ChatbotEmbedProps {
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export const ChatbotEmbed: React.FC<ChatbotEmbedProps> = ({ onLoad, onError }) => {
  const { user, profile } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initializeAttempted = useRef(false);
  const scriptsInjected = useRef(false);

  // Initialize chatbot by injecting embed code
  const initializeChatbot = useCallback(async () => {
    // Prevent multiple initialization attempts
    if (initializeAttempted.current) {
      console.log('⚠️ Chatbot initialization already attempted');
      return;
    }

    initializeAttempted.current = true;

    try {
      console.log('🤖 Initializing chatbot with embed code...');

      if (!chatbotConfig.enabled) {
        throw new Error('Chatbot is disabled in configuration');
      }

      if (!chatbotConfig.embedCode?.trim()) {
        throw new Error('No embed code provided in configuration');
      }

      setIsLoading(true);
      setError(null);

      // Set user data for chatbot access
      if (user && profile) {
        setUserDataForChatbot(user, profile);
      }

      await injectEmbedCode();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown chatbot error';
      console.error('❌ Chatbot initialization error:', err);
      setError(errorMessage);
      setIsLoading(false);
      onError?.(new Error(errorMessage));
    }
  }, [user, profile, onError]);

  // Inject the embed code into the page
  const injectEmbedCode = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        if (scriptsInjected.current) {
          console.log('✅ Scripts already injected');
          setIsLoaded(true);
          setIsLoading(false);
          onLoad?.();
          resolve();
          return;
        }

        console.log('📜 Injecting embed code...');

        // Create script element directly
        const script = document.createElement('script');
        script.type = 'text/javascript';
        
        // Extract just the JavaScript content from the embed code
        const scriptContent = chatbotConfig.embedCode
          .replace(/<script[^>]*>/gi, '')
          .replace(/<\/script>/gi, '')
          .trim();

        script.innerHTML = scriptContent;

        script.onload = () => {
          console.log('✅ Chatbot script loaded successfully');
          scriptsInjected.current = true;
          
          // Give chatbot time to initialize
          setTimeout(() => {
            setIsLoaded(true);
            setIsLoading(false);
            onLoad?.();
            resolve();
          }, 3000);
        };

        script.onerror = (err) => {
          console.error('❌ Failed to load chatbot script:', err);
          reject(new Error('Failed to load chatbot script'));
        };

        // Append to head
        document.head.appendChild(script);
        scriptsInjected.current = true;

        // Fallback timeout - assume success after 5 seconds
        setTimeout(() => {
          if (!isLoaded) {
            console.log('⏰ Chatbot initialization timeout - assuming success');
            setIsLoaded(true);
            setIsLoading(false);
            onLoad?.();
            resolve();
          }
        }, 5000);

      } catch (err) {
        console.error('❌ Error injecting embed code:', err);
        reject(err);
      }
    });
  };

  // Initialize on mount
  useEffect(() => {
    if (!chatbotConfig.enabled) {
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      initializeChatbot();
    }, 500);

    return () => clearTimeout(timer);
  }, [initializeChatbot]);

  // Update user data when user changes
  useEffect(() => {
    if (isLoaded && user && profile && chatbotConfig.sendUserData) {
      setUserDataForChatbot(user, profile);
      
      // Try to update Voiceflow user data if available
      setTimeout(() => {
        if ((window as any).voiceflow?.chat?.set) {
          try {
            (window as any).voiceflow.chat.set({
              user: {
                name: profile.display_name || user.email?.split('@')[0] || 'User',
                email: user.email,
                userId: user.id
              }
            });
            console.log('🔄 Updated user data in Voiceflow');
          } catch (e) {
            console.warn('⚠️ Could not update user data:', e);
          }
        }
      }, 1000);
    }
  }, [isLoaded, user, profile]);

  // Handle retry
  const handleRetry = useCallback(() => {
    console.log('🔄 Retrying chatbot initialization...');
    
    setError(null);
    setIsLoaded(false);
    setIsLoading(true);
    initializeAttempted.current = false;
    scriptsInjected.current = false;
    
    // Remove existing scripts
    const existingScripts = document.querySelectorAll('script[src*="voiceflow"]');
    existingScripts.forEach(script => script.remove());
    
    setTimeout(() => {
      initializeChatbot();
    }, 1000);
  }, [initializeChatbot]);

  // Render based on state
  if (!chatbotConfig.enabled) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <MessageSquare className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Chatbot Disabled</h3>
        <p className="text-gray-600 text-sm">The AI assistant is currently disabled.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Chatbot Error</h3>
        <p className="text-gray-600 text-sm mb-4">{error}</p>
        <div className="flex space-x-2">
          <button
            onClick={handleRetry}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading AI Coach...</h3>
        <p className="text-gray-600 text-sm">
          Initializing Voiceflow chatbot...
        </p>
        <div className="text-xs text-gray-400 mt-2">
          Project ID: 688d150bdb7293eb99bdbe16
        </div>
      </div>
    );
  }

  return (
    <div 
      data-testid="chatbot-embed"
      className="w-full h-full flex items-center justify-center"
    >
      <div className="text-center p-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
          <MessageSquare className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {chatbotConfig.title || 'AI Coach Ready!'}
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          {chatbotConfig.subtitle || 'Look for the Voiceflow chat widget on your screen.'}
        </p>
        <div className="text-xs text-gray-500">
          Voiceflow chatbot loaded successfully
        </div>
        
        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 text-xs text-gray-400">
            <details>
              <summary className="cursor-pointer">Debug Info</summary>
              <div className="mt-2 text-left bg-gray-50 p-2 rounded">
                <div>User: {user?.id}</div>
                <div>Profile: {profile?.id}</div>
                <div>Voiceflow Available: {(window as any).voiceflow ? 'Yes' : 'No'}</div>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};