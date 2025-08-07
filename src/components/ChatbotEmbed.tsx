// src/components/ChatbotEmbed.tsx - UNIVERSAL EMBED COMPONENT
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { chatbotConfig } from '../config/chatbot';
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
  const userDataSent = useRef(false);

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

      await injectEmbedCode();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown chatbot error';
      console.error('❌ Chatbot initialization error:', err);
      setError(errorMessage);
      setIsLoading(false);
      onError?.(new Error(errorMessage));
    }
  }, [onError]);

  // Inject the embed code into the page
  const injectEmbedCode = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        if (scriptsInjected.current) {
          console.log('✅ Scripts already injected');
          resolve();
          return;
        }

        console.log('📜 Injecting embed code...');

        // Create a temporary container to parse the HTML
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = chatbotConfig.embedCode;

        // Extract and inject scripts
        const scripts = tempContainer.getElementsByTagName('script');
        let scriptsToLoad = scripts.length;
        let scriptsLoaded = 0;

        if (scriptsToLoad === 0) {
          // No scripts to load, just inject HTML
          document.body.appendChild(tempContainer);
          scriptsInjected.current = true;
          setTimeout(() => {
            setIsLoaded(true);
            setIsLoading(false);
            onLoad?.();
            resolve();
          }, 1500);
          return;
        }

        // Function to handle script loading completion
        const handleScriptLoad = () => {
          scriptsLoaded++;
          console.log(`📜 Script ${scriptsLoaded}/${scriptsToLoad} loaded`);

          if (scriptsLoaded === scriptsToLoad) {
            scriptsInjected.current = true;
            console.log('✅ All scripts loaded successfully');

            // Give chatbot time to initialize
            setTimeout(() => {
              setIsLoaded(true);
              setIsLoading(false);
              onLoad?.();
              resolve();
            }, 2000);
          }
        };

        // Inject each script
        for (let i = 0; i < scripts.length; i++) {
          const originalScript = scripts[i];
          const newScript = document.createElement('script');

          // Handle script with src attribute
          if (originalScript.src) {
            newScript.src = originalScript.src;
            newScript.async = true;
            newScript.defer = originalScript.defer;
            
            newScript.onload = handleScriptLoad;
            newScript.onerror = () => {
              console.error(`❌ Failed to load script: ${originalScript.src}`);
              // Don't fail completely, just continue
              handleScriptLoad();
            };
          } else {
            // Handle inline script
            newScript.innerHTML = originalScript.innerHTML;
            
            // Inline scripts load immediately
            setTimeout(handleScriptLoad, 100);
          }

          // Copy other attributes
          for (let j = 0; j < originalScript.attributes.length; j++) {
            const attr = originalScript.attributes[j];
            if (attr.name !== 'src') {
              newScript.setAttribute(attr.name, attr.value);
            }
          }

          document.head.appendChild(newScript);
        }

        // Inject non-script content
        const nonScriptElements = tempContainer.querySelectorAll(':not(script)');
        nonScriptElements.forEach(element => {
          if (element.tagName !== 'SCRIPT') {
            document.body.appendChild(element.cloneNode(true));
          }
        });

        // Timeout fallback
        setTimeout(() => {
          if (!isLoaded && scriptsLoaded < scriptsToLoad) {
            console.warn('⚠️ Script loading timeout, proceeding anyway...');
            scriptsInjected.current = true;
            setIsLoaded(true);
            setIsLoading(false);
            onLoad?.();
            resolve();
          }
        }, 15000); // 15 second timeout

      } catch (err) {
        console.error('❌ Error injecting embed code:', err);
        reject(err);
      }
    });
  };

  // Send user data to chatbot (tries multiple common methods)
  const sendUserDataToChatbot = useCallback(() => {
    if (!user || !profile || userDataSent.current || !chatbotConfig.sendUserData) {
      return;
    }

    const userData = {
      userId: user.id,
      email: user.email,
      name: profile.display_name || user.email?.split('@')[0] || 'User',
      profileId: profile.id
    };

    console.log('👤 Attempting to send user data to chatbot...', userData);

    // Try multiple common chatbot APIs
    const sendAttempts = [
      // Voiceflow
      () => {
        if ((window as any).voiceflow?.chat?.set) {
          (window as any).voiceflow.chat.set({ user: userData });
          return true;
        }
        return false;
      },
      
      // Intercom
      () => {
        if ((window as any).Intercom) {
          (window as any).Intercom('update', {
            user_id: userData.userId,
            email: userData.email,
            name: userData.name
          });
          return true;
        }
        return false;
      },
      
      // Crisp
      () => {
        if ((window as any).$crisp) {
          (window as any).$crisp.push(['set', 'user:email', userData.email]);
          (window as any).$crisp.push(['set', 'user:nickname', userData.name]);
          return true;
        }
        return false;
      },
      
      // Tawk.to
      () => {
        if ((window as any).Tawk_API) {
          (window as any).Tawk_API.setAttributes({
            name: userData.name,
            email: userData.email,
            userId: userData.userId
          });
          return true;
        }
        return false;
      },
      
      // Zendesk
      () => {
        if ((window as any).zE) {
          (window as any).zE('webWidget', 'identify', {
            name: userData.name,
            email: userData.email
          });
          return true;
        }
        return false;
      },
      
      // Generic window object approach
      () => {
        // Try to find any chatbot object on window and send data
        const possibleChatbots = ['chatbot', 'chat', 'widget', 'messenger'];
        for (const name of possibleChatbots) {
          const chatbotObj = (window as any)[name];
          if (chatbotObj && typeof chatbotObj.setUser === 'function') {
            chatbotObj.setUser(userData);
            return true;
          }
          if (chatbotObj && typeof chatbotObj.identify === 'function') {
            chatbotObj.identify(userData);
            return true;
          }
        }
        return false;
      }
    ];

    // Try each method
    let sent = false;
    for (const attempt of sendAttempts) {
      try {
        if (attempt()) {
          sent = true;
          console.log('✅ User data sent successfully');
          break;
        }
      } catch (err) {
        console.warn('⚠️ Failed to send user data via one method:', err);
      }
    }

    if (!sent) {
      console.log('ℹ️ No compatible chatbot API found for user data');
    }

    userDataSent.current = true;
  }, [user, profile]);

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

  // Send user data when chatbot is loaded
  useEffect(() => {
    if (isLoaded) {
      const timer = setTimeout(() => {
        sendUserDataToChatbot();
      }, 2000); // Wait 2 seconds after chatbot loads

      return () => clearTimeout(timer);
    }
  }, [isLoaded, sendUserDataToChatbot]);

  // Handle retry
  const handleRetry = useCallback(() => {
    console.log('🔄 Retrying chatbot initialization...');
    
    setError(null);
    setIsLoaded(false);
    setIsLoading(true);
    initializeAttempted.current = false;
    scriptsInjected.current = false;
    userDataSent.current = false;
    
    setTimeout(() => {
      initializeChatbot();
    }, 500);
  }, [initializeChatbot]);

  // Handle disable
  const handleDisable = useCallback(() => {
    // You can modify chatbotConfig.enabled = false if needed
    setIsLoaded(false);
    setIsLoading(false);
    setError('Chatbot disabled by user');
  }, []);

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
          <button
            onClick={handleDisable}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm"
          >
            Disable
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
          Initializing your chatbot...
        </p>
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
          {chatbotConfig.subtitle || 'Look for the chat widget on your screen.'}
        </p>
        <div className="text-xs text-gray-500">
          Chatbot successfully loaded
        </div>
      </div>
    </div>
  );
};