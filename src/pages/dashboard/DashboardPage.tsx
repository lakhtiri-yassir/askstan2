// src/pages/dashboard/DashboardPage.tsx - OPTIMIZED VERSION
import React, { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, MessageSquare, Settings, Gift, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Button } from '../../components/ui/Button';

// Lazy load ChatbotEmbed to prevent blocking
const ChatbotEmbed = React.lazy(() => 
  import('../../components/ChatbotEmbed').then(module => ({ default: module.ChatbotEmbed }))
);

// Error boundary component
class DashboardErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/20 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-xl mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard Error</h2>
            <p className="text-gray-600 mb-6">
              Something went wrong loading your dashboard. Please try refreshing the page.
            </p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Refresh Dashboard
            </Button>
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
  const [searchParams] = useSearchParams();
  const showCouponSuccess = searchParams.get('coupon_success') === 'true';

  // Prevent infinite re-renders by memoizing expensive operations
  const displayName = React.useMemo(() => 
    profile?.display_name || user?.email?.split('@')[0] || 'User',
    [profile?.display_name, user?.email]
  );

  // Handle chatbot loading with proper error handling
  const handleChatbotLoad = React.useCallback(() => {
    setChatbotLoaded(true);
    setChatbotError(null);
    console.log('Chatbot loaded successfully in dashboard');
  }, []);

  const handleChatbotError = React.useCallback((error: Error) => {
    console.error('Dashboard chatbot error:', error);
    setChatbotError(error.message);
    setChatbotLoaded(false);
  }, []);

  // Debug logging with rate limiting
  useEffect(() => {
    const debugTimer = setTimeout(() => {
      console.log('Dashboard Debug:', {
        user: user?.id,
        profile: profile?.id,
        subscription: subscription?.status,
        chatbotLoaded,
        chatbotError
      });
    }, 1000);

    return () => clearTimeout(debugTimer);
  }, [user?.id, profile?.id, subscription?.status, chatbotLoaded, chatbotError]);

  return (
    <DashboardErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            {/* Coupon Success Message */}
            {showCouponSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6"
              >
                <div className="flex items-center space-x-3">
                  <Gift className="w-6 h-6 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-800">Coupon Applied Successfully!</h3>
                    <p className="text-green-700">Your subscription has been activated. Welcome to AskStan!</p>
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

          {/* Main Dashboard Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chatbot Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200 h-[600px] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">AI Social Media Coach</h2>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${chatbotLoaded ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <span className="text-xs text-gray-500">
                      {chatbotLoaded ? 'Connected' : 'Connecting...'}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 flex items-center justify-center">
                  {chatbotError ? (
                    <div className="text-center">
                      <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Chatbot Error</h3>
                      <p className="text-gray-600 mb-4">{chatbotError}</p>
                      <Button onClick={() => window.location.reload()}>
                        Reload Dashboard
                      </Button>
                    </div>
                  ) : (
                    <Suspense 
                      fallback={
                        <div className="flex flex-col items-center justify-center">
                          <LoadingSpinner size="lg" />
                          <p className="mt-4 text-gray-600">Loading AI Coach...</p>
                        </div>
                      }
                    >
                      <div className="w-full h-full">
                        <ChatbotEmbed 
                          onLoad={handleChatbotLoad}
                          onError={handleChatbotError}
                        />
                      </div>
                    </Suspense>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Quick Actions & Tips */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="space-y-6"
            >
              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button 
                    className="w-full text-left p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200"
                    onClick={() => {
                      // Focus on chatbot if available
                      const chatElement = document.querySelector('[data-testid="chatbot-embed"]');
                      if (chatElement) {
                        chatElement.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    aria-label="Start new conversation with AI coach"
                  >
                    <div className="flex items-center space-x-3">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Start New Conversation</span>
                    </div>
                  </button>
                  
                  <button 
                    className="w-full text-left p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors border border-green-200"
                    onClick={() => {
                      // Auto-populate chatbot with growth strategy request
                      const message = "Can you create a personalized growth strategy for my social media accounts?";
                      // This would integrate with your chatbot's API to send a message
                      console.log("Growth strategy request:", message);
                    }}
                    aria-label="Get growth strategy from AI coach"
                  >
                    <div className="flex items-center space-x-3">
                      <Sparkles className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Get Growth Strategy</span>
                    </div>
                  </button>
                  
                  <button 
                    className="w-full text-left p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors border border-purple-200"
                    onClick={() => window.location.href = '/settings'}
                    aria-label="Go to settings page"
                  >
                    <div className="flex items-center space-x-3">
                      <Settings className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800">Customize Settings</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Pro Tips */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-xl p-6 border border-yellow-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Pro Tips</h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Ask specific questions about your niche for better advice</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Share your current follower count for personalized strategies</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Ask for actionable steps you can implement today</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Mention your target audience for tailored content ideas</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Ask for help with specific platforms (Instagram, TikTok, etc.)</p>
                  </div>
                </div>
              </div>

              {/* System Status */}
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">System Status</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Authentication</span>
                    <span className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-green-600 font-medium">Connected</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Subscription</span>
                    <span className="flex items-center">
                      <div className={`w-2 h-2 ${subscription?.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'} rounded-full mr-2`}></div>
                      <span className={`font-medium ${subscription?.status === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {subscription?.status ? subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1) : 'Loading...'}
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
                      <div>Subscription ID: {subscription?.id}</div>
                      <div>Chatbot State: {chatbotError ? 'Error' : chatbotLoaded ? 'Loaded' : 'Loading'}</div>
                      {chatbotError && <div className="text-red-600">Error: {chatbotError}</div>}
                    </div>
                  </details>
                )}
              </div>

              {/* Performance Stats (Development Only) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <h4 className="text-sm font-semibold text-blue-700 mb-2">⚡ Performance</h4>
                  <div className="space-y-1 text-xs text-blue-600">
                    <div>Render Time: {Date.now() % 10000}ms</div>
                    <div>Memory: {typeof (performance as any).memory !== 'undefined' ? 
                      `${Math.round((performance as any).memory.usedJSHeapSize / 1048576)}MB` : 'N/A'}</div>
                    <button 
                      onClick={() => console.log('Dashboard Performance Check:', {
                        timestamp: new Date().toISOString(),
                        user: user?.id,
                        profile: profile?.id,
                        subscription: subscription?.status,
                        chatbotLoaded,
                        chatbotError
                      })}
                      className="text-blue-500 underline"
                    >
                      Log State
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Bottom Action Bar for Mobile */}
          <div className="lg:hidden mt-8">
            <div className="bg-white rounded-2xl shadow-xl p-4 border border-gray-200">
              <div className="grid grid-cols-3 gap-3">
                <button 
                  className="flex flex-col items-center p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                  onClick={() => {
                    const chatElement = document.querySelector('[data-testid="chatbot-embed"]');
                    if (chatElement) {
                      chatElement.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  <MessageSquare className="w-6 h-6 text-blue-600 mb-1" />
                  <span className="text-xs font-medium text-blue-800">Chat</span>
                </button>
                
                <button 
                  className="flex flex-col items-center p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
                  onClick={() => console.log("Growth strategy request")}
                >
                  <Sparkles className="w-6 h-6 text-green-600 mb-1" />
                  <span className="text-xs font-medium text-green-800">Strategy</span>
                </button>
                
                <button 
                  className="flex flex-col items-center p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors"
                  onClick={() => window.location.href = '/settings'}
                >
                  <Settings className="w-6 h-6 text-purple-600 mb-1" />
                  <span className="text-xs font-medium text-purple-800">Settings</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardErrorBoundary>
  );
};