// src/pages/dashboard/DashboardPage.tsx - Updated with large AskStan banner
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Sparkles, Settings, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { chatbotConfig, setUserDataForChatbot, shouldLoadChatbot } from '../../config/chatbot';
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
        const scripts = script.querySelectorAll('script');
        scripts.forEach(scriptTag => {
          const newScript = document.createElement('script');
          newScript.textContent = scriptTag.textContent;
          if (scriptTag.src) {
            newScript.src = scriptTag.src;
          }
          document.body.appendChild(newScript);
        });

        // Add HTML content to chatbot container
        const chatbotContainer = document.getElementById('chatbot-container');
        if (chatbotContainer && script.innerHTML) {
          const htmlContent = script.innerHTML.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
          chatbotContainer.innerHTML = htmlContent;
        }

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

    // Cleanup function
    return () => {
      const chatbotContainer = document.getElementById('chatbot-container');
      if (chatbotContainer) {
        chatbotContainer.innerHTML = '';
      }
    };
  }, [location.pathname, user, profile]);

  return (
    <DashboardErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
        {/* Dashboard Header */}
        <div className="bg-white/90 backdrop-blur-lg shadow-lg border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome back, {displayName}! 👋
                </h1>
                <p className="text-gray-600">
                  Your AI social media coach is ready to help you grow your presence
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-100 to-blue-100 rounded-full">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-green-800">
                    {subscriptionStatus?.status === 'active' ? 'Premium Active' : 'Account Active'}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Sidebar - Quick Stats */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-gray-200"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Sparkles className="w-6 h-6 text-yellow-500 mr-2" />
                  Quick Actions
                </h2>
                
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">AI Content Coach</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Get personalized strategies for your social media growth
                    </p>
                    <div className="inline-flex items-center text-blue-600 text-sm font-medium">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Chat with Stan
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-yellow-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Growth Analytics</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Track your progress and optimize your strategy
                    </p>
                    <div className="inline-flex items-center text-green-600 text-sm font-medium">
                      <Settings className="w-4 h-4 mr-1" />
                      View Analytics
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Main Chatbot Area */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
                style={{ minHeight: '600px' }}
              >
                {/* Chatbot Header */}
                <div className="bg-gradient-to-r from-blue-500 to-yellow-500 px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    <h2 className="text-white font-bold text-lg">AskStan! AI Coach</h2>
                  </div>
                </div>

                {/* Chatbot Container with Large Banner */}
                <div 
                  id="chatbot-container" 
                  className="relative w-full h-full flex flex-col items-center justify-center p-8"
                  style={{ minHeight: '500px' }}
                >
                  {/* Large AskStan Banner */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="flex flex-col items-center justify-center text-center"
                  >
                    <img
                      src={askstanBanner}
                      alt="AskStan! AI Social Media Coach"
                      className="w-80 h-80 md:w-96 md:h-96 lg:w-[28rem] lg:h-[28rem] xl:w-[32rem] xl:h-[32rem] object-contain mb-6"
                      style={{ maxWidth: '90%', maxHeight: '400px' }}
                    />
                    
                    <div className="max-w-md">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        Your AI Coach is Ready!
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Start a conversation with Stan to get personalized social media strategies, 
                        content ideas, and growth tips tailored just for you.
                      </p>
                      
                      {chatbotError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                          <p className="text-red-700 text-sm">{chatbotError}</p>
                        </div>
                      )}
                      
                      {!chatbotLoaded && !chatbotError && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                          <p className="text-blue-700 text-sm">Loading your AI coach...</p>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        Powered by Advanced AI Technology
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Bottom Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8"
          >
            <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg p-6 text-center border border-gray-200">
              <div className="text-3xl font-bold text-blue-600 mb-2">24/7</div>
              <div className="text-gray-600">AI Support Available</div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg p-6 text-center border border-gray-200">
              <div className="text-3xl font-bold text-green-600 mb-2">∞</div>
              <div className="text-gray-600">Unlimited Conversations</div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg p-6 text-center border border-gray-200">
              <div className="text-3xl font-bold text-purple-600 mb-2">🚀</div>
              <div className="text-gray-600">Growth Accelerated</div>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardErrorBoundary>
  );
};

export default DashboardPage;