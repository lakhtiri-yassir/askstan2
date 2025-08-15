// src/pages/dashboard/DashboardPage.tsx - Complete Version
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Sparkles, Settings, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { chatbotConfig, setUserDataForChatbot, shouldLoadChatbot } from '../../config/chatbot';
import { useLocation } from 'react-router-dom';

// Error Boundary Component for Dashboard
class DashboardErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard Error</h2>
            <p className="text-gray-600 mb-6">
              We encountered an issue loading your dashboard. Please refresh the page or contact support.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const DashboardPage: React.FC = () => {
  const { user, profile, subscriptionStatus } = useAuth();
  const [chatbotLoaded, setChatbotLoaded] = useState(false);
  const [chatbotError, setChatbotError] = useState<string | null>(null);
  const chatbotLoadedRef = useRef(false);
  const location = useLocation();

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'User';

  // Load chatbot only on dashboard
  useEffect(() => {
    if (!shouldLoadChatbot(location.pathname)) {
      return;
    }

    if (chatbotLoadedRef.current || !chatbotConfig.enabled) {
      return;
    }

    const loadChatbot = async () => {
      try {
        console.log('🤖 Loading chatbot for dashboard...');
        setChatbotError(null);

        // Set user data for chatbot if enabled
        if (chatbotConfig.sendUserData && user && profile) {
          setUserDataForChatbot(user, profile);
        }

        // Create a script element and inject the chatbot code
        const script = document.createElement('div');
        script.innerHTML = chatbotConfig.embedCode;
        
        // Find and execute any script tags
        const scriptTags = script.querySelectorAll('script');
        scriptTags.forEach((oldScript) => {
          const newScript = document.createElement('script');
          
          // Copy all attributes
          Array.from(oldScript.attributes).forEach((attr) => {
            newScript.setAttribute(attr.name, attr.value);
          });
          
          // Copy script content
          newScript.textContent = oldScript.textContent;
          
          // Add to document head
          document.head.appendChild(newScript);
        });

        // Set loaded state
        chatbotLoadedRef.current = true;
        setChatbotLoaded(true);
        
        console.log('✅ Chatbot loaded successfully');
      } catch (error) {
        console.error('❌ Chatbot loading error:', error);
        setChatbotError('Failed to load AI coach');
        setChatbotLoaded(false);
      }
    };

    // Load chatbot after a short delay to ensure page is ready
    const timer = setTimeout(loadChatbot, 1000);
    return () => clearTimeout(timer);
  }, [user, profile, location.pathname]);

  // Cleanup chatbot when leaving dashboard
  useEffect(() => {
    return () => {
      if (location.pathname !== '/dashboard') {
        console.log('🧹 Cleaning up chatbot when leaving dashboard');
        chatbotLoadedRef.current = false;
        setChatbotLoaded(false);
        setChatbotError(null);
      }
    };
  }, [location.pathname]);

  return (
    <DashboardErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            {/* Welcome Message */}
            {!chatbotLoaded && !chatbotError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6"
              >
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-4"></div>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">Setting up your AI coach...</h3>
                    <p className="text-blue-700">Your personalized social media growth assistant is loading.</p>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome back, <span className="text-blue-600">{displayName}</span>!
                  </h1>
                  <p className="text-gray-600">
                    Your AI social media coach is ready to help you grow your online presence.
                  </p>
                </div>
                <div className="hidden md:flex items-center space-x-4">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-2">
                      <Sparkles className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-xs text-gray-600 font-medium">AI Powered</p>
                  </div>
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mb-2">
                      <MessageSquare className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-xs text-gray-600 font-medium">24/7 Support</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Dashboard Content - Full Width Chatbot */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full"
          >
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200 h-[700px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">AI Social Media Coach</h2>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${chatbotLoaded ? 'bg-green-500' : chatbotError ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                  <span className="text-xs text-gray-500">
                    {chatbotError ? 'Error' : chatbotLoaded ? 'Connected' : 'Connecting...'}
                  </span>
                </div>
              </div>
              
              <div className="flex-1 flex items-center justify-center">
                {chatbotError ? (
                  <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Coach Unavailable</h3>
                    <p className="text-gray-600 mb-4">{chatbotError}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Retry Connection
                    </button>
                  </div>
                ) : chatbotLoaded ? (
                  <div className="text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Coach Connected!</h3>
                    <p className="text-gray-600">
                      Your AI social media coach is ready. Look for the chat widget to start your conversation.
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="animate-pulse">
                      <div className="w-16 h-16 bg-blue-200 rounded-full mx-auto mb-4"></div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Connecting to AI Coach...</h3>
                    <p className="text-gray-600">
                      Setting up your personalized social media growth assistant.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Status Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-8"
          >
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Subscription</span>
                  <span className="flex items-center">
                    <div className={`w-2 h-2 ${subscriptionStatus?.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'} rounded-full mr-2`}></div>
                    <span className={`font-medium ${subscriptionStatus?.status === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {subscriptionStatus?.status ? subscriptionStatus.status.charAt(0).toUpperCase() + subscriptionStatus.status.slice(1) : 'Loading...'}
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">AI Coach</span>
                  <span className="flex items-center">
                    <div className={`w-2 h-2 ${chatbotLoaded ? 'bg-green-500' : chatbotError ? 'bg-red-500' : 'bg-yellow-500'} rounded-full mr-2`}></div>
                    <span className={`font-medium ${chatbotLoaded ? 'text-green-600' : chatbotError ? 'text-red-600' : 'text-yellow-600'}`}>
                      {chatbotError ? 'Error' : chatbotLoaded ? 'Ready' : 'Loading...'}
                    </span>
                  </span>
                </div>
              </div>
              
              {/* Debug info in development */}
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-3 text-xs">
                  <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                    Debug Info (Dev Only)
                  </summary>
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono">
                    <div>User ID: {user?.id}</div>
                    <div>Profile ID: {profile?.id}</div>
                    <div>Subscription ID: {subscriptionStatus?.id}</div>
                    <div>Chatbot State: {chatbotError ? 'Error' : chatbotLoaded ? 'Loaded' : 'Loading'}</div>
                    <div>Current Path: {location.pathname}</div>
                    {chatbotError && <div className="text-red-600">Error: {chatbotError}</div>}
                  </div>
                </details>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardErrorBoundary>
  );
};