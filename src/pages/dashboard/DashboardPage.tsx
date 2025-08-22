// src/pages/dashboard/DashboardPage.tsx - FIXED: Larger chatbot container, always show banner
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Sparkles, Settings, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { chatbotConfig, setUserDataForChatbot, shouldLoadChatbot, removeChatbot } from '../../config/chatbot';
import { useLocation } from 'react-router-dom';
import askstanBanner from '../../img/askstanbanner.png';

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
  const { user, profile, subscription } = useAuth();
  const [chatbotLoaded, setChatbotLoaded] = useState(false);
  const [chatbotError, setChatbotError] = useState<string | null>(null);
  const chatbotLoadedRef = useRef(false);
  const location = useLocation();

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'User';

  // FIXED: Improved chatbot loading with cleanup
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
        const scripts = script.querySelectorAll('script');
        scripts.forEach(scriptTag => {
          const newScript = document.createElement('script');
          newScript.textContent = scriptTag.textContent;
          if (scriptTag.src) {
            newScript.src = scriptTag.src;
          }
          document.body.appendChild(newScript);
        });

        chatbotLoadedRef.current = true;
        setChatbotLoaded(true);
        
        console.log('✅ Chatbot loaded successfully');
      } catch (error: any) {
        console.error('❌ Chatbot loading error:', error);
        setChatbotError(error.message || 'Failed to load chatbot');
      }
    };

    // Small delay to ensure DOM is ready
    setTimeout(loadChatbot, 1000);

    // CLEANUP: Remove chatbot when component unmounts or user leaves dashboard
    return () => {
      console.log('🧹 Cleaning up chatbot...');
      removeChatbot();
      chatbotLoadedRef.current = false;
      setChatbotLoaded(false);
    };
  }, [location.pathname, user, profile]);

  // CLEANUP: Remove chatbot when user changes (sign out)
  useEffect(() => {
    if (!user) {
      console.log('🧹 User signed out, cleaning up chatbot...');
      removeChatbot();
      chatbotLoadedRef.current = false;
      setChatbotLoaded(false);
    }
  }, [user]);

  return (
    <DashboardErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/90 backdrop-blur-lg shadow-lg border-b border-gray-200 py-8"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome back, {displayName}! 👋
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Your AI social media coach is ready to help you grow your presence
            </p>
            
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-100 to-blue-100 rounded-full">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-800">
                {subscription?.status === 'active' ? 'Premium Active' : 'Account Active'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Main Dashboard Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* AI Coach Section - LARGER CONTAINER */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-8"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-yellow-500 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></div>
                  <h2 className="text-white font-bold text-xl flex items-center">
                    <MessageSquare className="w-6 h-6 mr-2" />
                    AskStan! AI Coach
                  </h2>
                </div>
                <div className="text-white/80 text-sm">
                  24/7 Available
                </div>
              </div>
            </div>

            {/* FIXED: Larger Chatbot Container with Always-Visible Banner */}
            <div className="relative w-full bg-white" style={{ minHeight: '700px' }}>
              {/* ALWAYS VISIBLE: AskStan Banner */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="flex flex-col items-center"
                >
                  <img
                    src={askstanBanner}
                    alt="AskStan! AI Social Media Coach"
                    className="w-64 h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 object-contain mb-6 mx-auto drop-shadow-lg"
                  />
                  
                  <div className="max-w-lg mx-auto">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      Your AI Coach is Ready!
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Stan is here to help you grow your social media presence. Click the chat widget to start your conversation and get personalized insights for LinkedIn, content strategy, and audience engagement.
                    </p>
                    
                    {/* Status Indicators */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
                      <div className="flex items-center text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                        <span>AI Coach Online</span>
                      </div>
                      <div className="flex items-center text-blue-600">
                        <Sparkles className="w-4 h-4 mr-2" />
                        <span>LinkedIn Expert Ready</span>
                      </div>
                      <div className="flex items-center text-purple-600">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        <span>24/7 Available</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Chatbot Integration Area */}
              <div 
                id="chatbot-container" 
                className="relative w-full h-full z-10"
                style={{ minHeight: '700px' }}
              >
                {/* Chatbot will load here via JavaScript */}
              </div>

              {/* Error State */}
              {chatbotError && (
                <div className="absolute bottom-4 right-4 bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  {chatbotError}
                </div>
              )}

              {/* Loading State */}
              {!chatbotLoaded && !chatbotError && (
                <div className="absolute bottom-4 left-4 bg-blue-100 border border-blue-300 text-blue-700 px-4 py-2 rounded-lg text-sm">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Loading AI Coach...
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Actions Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Content Ideas</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Get personalized content suggestions for your social media platforms.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <MessageSquare className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">LinkedIn Strategy</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Optimize your LinkedIn profile and develop winning networking strategies.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Growth Analytics</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Track your progress and get insights on your social media growth.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardErrorBoundary>
  );
};

export default DashboardPage;