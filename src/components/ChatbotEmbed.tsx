// src/components/ChatbotEmbed.tsx - BRANDED WITH ASKSTAN LOGO
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { chatbotConfig, setUserDataForChatbot } from '../config/chatbot';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// Import your logo - make sure to place it in src/assets/images
import askStanLogo from '../assets/images/hero-image.jpg'; // Adjust the filename as needed

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
      console.log('🤖 Initializing AskStan AI Coach...');

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
          console.log('✅ AskStan AI Coach script loaded successfully');
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
          console.error('❌ Failed to load AskStan AI Coach script:', err);
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
      
      // Try to update chatbot user data if available
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
            console.log('🔄 Updated user data in AskStan AI Coach');
          } catch (e) {
            console.warn('⚠️ Could not update user data:', e);
          }
        }
      }, 1000);
    }
  }, [isLoaded, user, profile]);

  // Handle retry
  const handleRetry = useCallback(() => {
    console.log('🔄 Retrying AskStan AI Coach initialization...');
    
    setError(null);
    setIsLoaded(false);
    setIsLoading(true);
    initializeAttempted.current = false;
    scriptsInjected.current = false;
    
    // Remove existing scripts
    const existingScripts = document.querySelectorAll('script[src*="voiceflow"], script[src*="widget"]');
    existingScripts.forEach(script => script.remove());
    
    setTimeout(() => {
      initializeChatbot();
    }, 1000);
  }, [initializeChatbot]);

  // Render based on state
  if (!chatbotConfig.enabled) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <img 
          src={askStanLogo} 
          alt="AskStan Logo" 
          className="w-16 h-16 mb-4"
          onError={(e) => {
            // Fallback to a simple div if logo fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4" id="logo-fallback" style={{ display: 'none' }}>
          <span className="text-2xl font-bold text-blue-600">AS</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Coach Disabled</h3>
        <p className="text-gray-600 text-sm">The AI assistant is currently disabled.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <img 
          src={askStanLogo} 
          alt="AskStan Logo" 
          className="w-16 h-16 mb-4 opacity-50"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = document.getElementById('error-logo-fallback');
            if (fallback) fallback.style.display = 'flex';
          }}
        />
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4" id="error-logo-fallback" style={{ display: 'none' }}>
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Error</h3>
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
        <div className="relative mb-6">
          <img 
            src={askStanLogo} 
            alt="AskStan Logo" 
            className="w-20 h-20 animate-pulse"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = document.getElementById('loading-logo-fallback');
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          <div className="w-20 h-20 bg-blue-100 rounded-xl flex items-center justify-center animate-pulse" id="loading-logo-fallback" style={{ display: 'none' }}>
            <span className="text-2xl font-bold text-blue-600">AS</span>
          </div>
          
          {/* Animated loading ring around logo */}
          <div className="absolute inset-0 w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
        
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h3>
          <p className="text-gray-600 text-sm">
            Initializing your AI coach
          </p>
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
        <div className="relative mb-6">
          <img 
            src={askStanLogo} 
            alt="AskStan Logo" 
            className="w-20 h-20 mx-auto"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = document.getElementById('ready-logo-fallback');
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          <div className="w-20 h-20 bg-green-100 rounded-xl flex items-center justify-center mx-auto" id="ready-logo-fallback" style={{ display: 'none' }}>
            <span className="text-2xl font-bold text-green-600">AS</span>
          </div>
          
          {/* Success indicator */}
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Stan is ready!
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Your AI social media coach is now available. Look for the chat widget to start your conversation.
          </p>
          <div className="text-xs text-gray-500">
            Powered by Yvexan Agency
          </div>
        </div>
        
        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 text-xs text-gray-400">
            <details>
              <summary className="cursor-pointer hover:text-gray-600">Debug Info</summary>
              <div className="mt-2 text-left bg-gray-50 p-3 rounded text-xs">
                <div><strong>User ID:</strong> {user?.id || 'None'}</div>
                <div><strong>Profile ID:</strong> {profile?.id || 'None'}</div>
                <div><strong>Chatbot Available:</strong> {(window as any).voiceflow ? 'Yes' : 'No'}</div>
                <div><strong>User Data Sent:</strong> {chatbotConfig.sendUserData ? 'Enabled' : 'Disabled'}</div>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};