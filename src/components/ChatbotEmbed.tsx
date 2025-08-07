// src/components/ChatbotEmbed.tsx - FIXED VOICEFLOW INTEGRATION
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ChatbotEmbedProps {
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export const ChatbotEmbed: React.FC<ChatbotEmbedProps> = ({ onLoad, onError }) => {
  const { user, profile } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializeAttempted = useRef(false);

  useEffect(() => {
    // Prevent multiple initialization attempts
    if (initializeAttempted.current) {
      console.log("⚠️ Chatbot initialization already attempted");
      return;
    }

    initializeAttempted.current = true;

    const initializeChatbot = async () => {
      try {
        console.log("🤖 Initializing Voiceflow chatbot...");

        // Check if Voiceflow is already loaded
        if (typeof window !== 'undefined' && (window as any).voiceflow) {
          console.log("✅ Voiceflow already loaded, reinitializing...");
          await reinitializeVoiceflow();
          return;
        }

        // Load Voiceflow script if not already loaded
        const existingScript = document.querySelector('script[src*="voiceflow.com"]');
        if (existingScript) {
          console.log("📜 Voiceflow script already exists, waiting for load...");
          await waitForVoiceflowLoad();
          return;
        }

        console.log("📡 Loading Voiceflow script...");
        await loadVoiceflowScript();

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown chatbot error';
        console.error("❌ Chatbot initialization error:", err);
        setError(errorMessage);
        onError?.(new Error(errorMessage));
      }
    };

    initializeChatbot();

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up chatbot...");
      // Don't remove script on cleanup as it may be used by other components
    };
  }, []); // Empty dependency array - only run once

  // Function to load Voiceflow script
  const loadVoiceflowScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://cdn.voiceflow.com/widget/bundle.mjs';
      script.async = true;
      
      script.onload = () => {
        console.log("✅ Voiceflow script loaded successfully");
        setTimeout(() => {
          initializeVoiceflowWidget();
          resolve();
        }, 500); // Small delay to ensure script is fully initialized
      };

      script.onerror = (error) => {
        console.error("❌ Failed to load Voiceflow script:", error);
        reject(new Error('Failed to load chatbot script'));
      };

      document.head.appendChild(script);
    });
  };

  // Function to wait for existing Voiceflow script to load
  const waitForVoiceflowLoad = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const maxAttempts = 50;
      let attempts = 0;

      const checkVoiceflow = () => {
        attempts++;
        
        if ((window as any).voiceflow) {
          console.log("✅ Voiceflow detected, initializing widget...");
          initializeVoiceflowWidget();
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error('Voiceflow script timeout'));
        } else {
          setTimeout(checkVoiceflow, 100);
        }
      };

      checkVoiceflow();
    });
  };

  // Function to reinitialize existing Voiceflow
  const reinitializeVoiceflow = async (): Promise<void> => {
    try {
      // Close existing chat if open
      if ((window as any).voiceflow?.chat?.close) {
        (window as any).voiceflow.chat.close();
      }
      
      // Small delay before reinitializing
      await new Promise(resolve => setTimeout(resolve, 300));
      
      initializeVoiceflowWidget();
    } catch (err) {
      console.error("❌ Error reinitializing Voiceflow:", err);
      throw err;
    }
  };

  // Function to initialize Voiceflow widget
  const initializeVoiceflowWidget = () => {
    try {
      console.log("🎯 Initializing Voiceflow widget...");

      if (!(window as any).voiceflow) {
        throw new Error('Voiceflow not available on window object');
      }

      const voiceflow = (window as any).voiceflow;
      
      // Configure Voiceflow
      voiceflow.chat.load({
        verify: { projectID: import.meta.env.VITE_VOICEFLOW_PROJECT_ID || '66fe0e23324b4e19cd17be91' },
        url: 'https://general-runtime.voiceflow.com',
        versionID: 'production',
        assistant: {
          title: "AskStan! AI Coach",
          description: "Your AI Social Media Growth Expert",
          image: "https://s3.amazonaws.com/com.voiceflow.studio/share/askstan-avatar.png",
          color: "#3B82F6",
        },
        config: {
          allowDownload: false,
          allowDebug: false,
        }
      });

      // Send user data if available
      if (user && profile) {
        console.log("👤 Sending user data to Voiceflow...");
        
        // Set user data
        voiceflow.chat.set({
          user: {
            name: profile.display_name || user.email?.split('@')[0] || 'User',
            email: user.email,
            userId: user.id,
            profileId: profile.id,
          },
          config: {
            persist: true,
          }
        });

        console.log("✅ User data sent to Voiceflow");
      }

      // Set up event listeners
      voiceflow.chat.on('open', () => {
        console.log("🎉 Voiceflow chat opened");
      });

      voiceflow.chat.on('close', () => {
        console.log("📱 Voiceflow chat closed");
      });

      voiceflow.chat.on('minimize', () => {
        console.log("📱 Voiceflow chat minimized");
      });

      voiceflow.chat.on('maximize', () => {
        console.log("📱 Voiceflow chat maximized");
      });

      console.log("🎉 Voiceflow widget initialized successfully!");
      setIsLoaded(true);
      setError(null);
      onLoad?.();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize widget';
      console.error("❌ Voiceflow widget initialization error:", err);
      setError(errorMessage);
      onError?.(new Error(errorMessage));
    }
  };

  // Render based on state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Chatbot Unavailable</h3>
        <p className="text-gray-600 text-sm mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null);
            setIsLoaded(false);
            initializeAttempted.current = false;
            window.location.reload();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading AI Coach...</h3>
        <p className="text-gray-600 text-sm">Connecting to your personalized assistant</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      data-testid="chatbot-embed"
      className="w-full h-full flex items-center justify-center"
    >
      <div className="text-center p-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Coach Ready!</h3>
        <p className="text-gray-600 text-sm mb-4">Click the chat bubble in the bottom right to start your conversation.</p>
        <div className="text-xs text-gray-500">
          Powered by AskStan! AI
        </div>
      </div>
    </div>
  );
};