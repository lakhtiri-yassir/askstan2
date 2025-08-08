// src/components/ChatbotEmbed.tsx - RESPONSIVE LOGO WITH WORKING CHATBOT INTEGRATION
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { chatbotConfig, setUserDataForChatbot } from "../config/chatbot";
import { AlertTriangle, RefreshCw } from "lucide-react";

// Import your logo - make sure to place it in src/assets/images
import askStanLogo from "../assets/images/hero-image.jpg"; // Adjust the filename as needed

interface ChatbotEmbedProps {
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export const ChatbotEmbed: React.FC<ChatbotEmbedProps> = ({
  onLoad,
  onError,
}) => {
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
      console.log("⚠️ Chatbot initialization already attempted");
      return;
    }

    initializeAttempted.current = true;

    try {
      console.log("🤖 Initializing AskStan AI Coach...");

      if (!chatbotConfig.enabled) {
        throw new Error("Chatbot is disabled in configuration");
      }

      if (!chatbotConfig.embedCode?.trim()) {
        throw new Error("No embed code provided in configuration");
      }

      setIsLoading(true);
      setError(null);

      // Set user data for chatbot access
      if (user && profile) {
        setUserDataForChatbot(user, profile);
      }

      await injectEmbedCode();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown chatbot error";
      console.error("❌ Chatbot initialization error:", err);
      setError(errorMessage);
      setIsLoading(false);
      onError?.(new Error(errorMessage));
    }
  }, [user, profile, onError]);

  // Inject the embed code into the page - WORKING VOICEFLOW INTEGRATION
  const injectEmbedCode = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        if (scriptsInjected.current) {
          console.log("✅ Scripts already injected");
          setIsLoaded(true);
          setIsLoading(false);
          onLoad?.();
          resolve();
          return;
        }

        console.log("📜 Injecting embed code...");

        // Create script element directly for Voiceflow
        const script = document.createElement("script");
        script.type = "text/javascript";

        // Extract just the JavaScript content from the embed code (keeping original logic)
        const scriptContent = chatbotConfig.embedCode
          .replace(/<script[^>]*>/gi, "")
          .replace(/<\/script>/gi, "")
          .trim();

        script.innerHTML = scriptContent;

        script.onload = () => {
          console.log("✅ AskStan AI Coach script loaded successfully");
          scriptsInjected.current = true;

          // Give chatbot time to initialize (keeping original timing)
          setTimeout(() => {
            setIsLoaded(true);
            setIsLoading(false);
            onLoad?.();
            resolve();
          }, 3000);
        };

        script.onerror = (err) => {
          console.error("❌ Failed to load AskStan AI Coach script:", err);
          reject(new Error("Failed to load chatbot script"));
        };

        // Append to head (keeping original approach)
        document.head.appendChild(script);
        scriptsInjected.current = true;

        // Fallback timeout - assume success after 5 seconds (keeping original logic)
        setTimeout(() => {
          if (!isLoaded) {
            console.log("⏰ Chatbot initialization timeout - assuming success");
            setIsLoaded(true);
            setIsLoading(false);
            onLoad?.();
            resolve();
          }
        }, 5000);
      } catch (err) {
        console.error("❌ Error injecting embed code:", err);
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

  // Update user data when user changes (keeping original Voiceflow integration)
  useEffect(() => {
    if (isLoaded && user && profile && chatbotConfig.sendUserData) {
      setUserDataForChatbot(user, profile);

      // Try to update chatbot user data if available
      setTimeout(() => {
        if ((window as any).voiceflow?.chat?.set) {
          try {
            (window as any).voiceflow.chat.set({
              user: {
                name:
                  profile.display_name || user.email?.split("@")[0] || "User",
                email: user.email,
                userId: user.id,
              },
            });
            console.log("🔄 Updated user data in AskStan AI Coach");
          } catch (e) {
            console.warn("⚠️ Could not update user data:", e);
          }
        }
      }, 1000);
    }
  }, [isLoaded, user, profile]);

  // Handle retry (keeping original logic for script cleanup)
  const handleRetry = useCallback(() => {
    console.log("🔄 Retrying AskStan AI Coach initialization...");

    setError(null);
    setIsLoaded(false);
    setIsLoading(true);
    initializeAttempted.current = false;
    scriptsInjected.current = false;

    // Remove existing scripts
    const existingScripts = document.querySelectorAll(
      'script[src*="voiceflow"], script[src*="widget"]'
    );
    existingScripts.forEach((script) => script.remove());

    setTimeout(() => {
      initializeChatbot();
    }, 1000);
  }, [initializeChatbot]);

  // RESPONSIVE STATES WITH CONTAINER-CORNER STATUS INDICATORS

  // Render based on state
  if (!chatbotConfig.enabled) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 text-center">
        {/* Container Corner Status - Disabled */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
          <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-400 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </div>

        <div className="relative mb-4 sm:mb-6">
          <img
            src={askStanLogo}
            alt="AskStan Logo"
            className="w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[28rem] lg:h-[28rem] xl:w-[30rem] xl:h-[30rem] mx-auto object-contain max-w-full max-h-full opacity-50"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              const fallback = document.getElementById("disabled-logo-fallback");
              if (fallback) fallback.style.display = "flex";
            }}
          />
          <div
            className="w-36 h-36 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 xl:w-60 xl:h-60 bg-gray-100 rounded-xl flex items-center justify-center mx-auto opacity-50"
            id="disabled-logo-fallback"
            style={{ display: "none" }}
          >
            <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-gray-600">AS</span>
          </div>
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
          AI Coach Disabled
        </h3>
        <p className="text-sm text-gray-600">
          The AI assistant is currently disabled.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 text-center">
        {/* Container Corner Status - Error */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-red-500 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
          </div>
        </div>

        <div className="relative mb-4 sm:mb-6">
          <img
            src={askStanLogo}
            alt="AskStan Logo"
            className="w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[28rem] lg:h-[28rem] xl:w-[30rem] xl:h-[30rem] mx-auto object-contain max-w-full max-h-full opacity-50"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              const fallback = document.getElementById("error-logo-fallback");
              if (fallback) fallback.style.display = "flex";
            }}
          />
          <div
            className="w-36 h-36 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 xl:w-60 xl:h-60 bg-red-100 rounded-xl flex items-center justify-center mx-auto"
            id="error-logo-fallback"
            style={{ display: "none" }}
          >
            <AlertTriangle className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 xl:w-36 xl:h-36 text-red-600" />
          </div>
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
          Connection Error
        </h3>
        <p className="text-sm text-gray-600 mb-4">{error}</p>
        <button
          onClick={handleRetry}
          className="flex items-center space-x-2 px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 text-center">
        {/* Container Corner Status - Loading Spinner */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
          <div className="relative w-5 h-5 sm:w-6 sm:h-6">
            <div className="absolute inset-0 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        </div>

        <div className="relative mb-4 sm:mb-6">
          <img
            src={askStanLogo}
            alt="AskStan Logo"
            className="w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[28rem] lg:h-[28rem] xl:w-[30rem] xl:h-[30rem] mx-auto object-contain max-w-full max-h-full animate-pulse"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              const fallback = document.getElementById("loading-logo-fallback");
              if (fallback) fallback.style.display = "flex";
            }}
          />
          <div
            className="w-36 h-36 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 xl:w-60 xl:h-60 bg-blue-100 rounded-xl flex items-center justify-center animate-pulse mx-auto"
            id="loading-logo-fallback"
            style={{ display: "none" }}
          >
            <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-blue-600">AS</span>
          </div>
        </div>

        <h3 className="text-base sm:text-xl font-semibold text-gray-900 mb-2">
          Loading...
        </h3>
        <p className="text-sm text-gray-600">Initializing your AI coach</p>
      </div>
    );
  }

  // Ready state - Chatbot loaded successfully with responsive design
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 text-center">
      {/* Container Corner Status - Success Checkmark */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center">
          <svg
            className="w-3 h-3 sm:w-4 sm:h-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      </div>

      <div className="relative mb-4 sm:mb-6">
        <img
          src={askStanLogo}
          alt="AskStan Logo"
          className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 xl:w-112 xl:h-112 mx-auto object-contain"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            const fallback = document.getElementById("ready-logo-fallback");
            if (fallback) fallback.style.display = "flex";
          }}
        />
        <div
          className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 xl:w-56 xl:h-56 bg-green-100 rounded-xl flex items-center justify-center mx-auto"
          id="ready-logo-fallback"
          style={{ display: "none" }}
        >
          <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-green-600">AS</span>
        </div>
      </div>

      <h3 className="text-base sm:text-xl font-semibold text-gray-900 mb-2">
        {chatbotConfig.title || "Stan is ready!"}
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        {chatbotConfig.subtitle || "Your AI social media coach is now available. Look for the chat widget to start your conversation."}
      </p>
      <div className="text-xs text-gray-500">Powered by Yvexan Agency</div>

      {/* Debug info in development */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-6 text-xs text-gray-400">
          <details>
            <summary className="cursor-pointer hover:text-gray-600">
              Debug Info
            </summary>
            <div className="mt-2 text-left bg-gray-50 p-3 rounded text-xs">
              <div>
                <strong>User ID:</strong> {user?.id || "None"}
              </div>
              <div>
                <strong>Profile ID:</strong> {profile?.id || "None"}
              </div>
              <div>
                <strong>Chatbot Available:</strong>{" "}
                {(window as any).voiceflow ? "Yes" : "No"}
              </div>
              <div>
                <strong>User Data Sent:</strong>{" "}
                {chatbotConfig.sendUserData ? "Enabled" : "Disabled"}
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};