// src/pages/LandingPage.tsx - MODIFIED: Add session clear option
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Target, TrendingUp, Star, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

const LandingPage: React.FC = () => {
  const { user, hasActiveSubscription, signOut, addDebugLog } = useAuth();
  const navigate = useNavigate();
  const [showDebugOptions, setShowDebugOptions] = useState(false);

  // OPTION 1: Automatically clear session for users with subscription issues
  useEffect(() => {
    if (user) {
      addDebugLog('🔍 LandingPage: User detected, checking subscription status', {
        hasActiveSubscription,
        userEmail: user.email
      });

      // AUTO-CLEAR: Uncomment the lines below to automatically clear session
      // when user has subscription loading issues
      /*
      const timer = setTimeout(() => {
        if (!hasActiveSubscription) {
          addDebugLog('🧹 LandingPage: Auto-clearing session due to subscription issues');
          handleSignOut();
        }
      }, 2000); // Wait 2 seconds for subscription to load

      return () => clearTimeout(timer);
      */
    }
  }, [user, hasActiveSubscription, addDebugLog]);

  // Manual session clear function
  const handleSignOut = async () => {
    try {
      addDebugLog('🧹 LandingPage: Manually clearing session');
      await signOut();
      // Force page refresh to ensure clean state
      window.location.reload();
    } catch (error) {
      addDebugLog('❌ Sign out error', error);
      // Force clear even if signOut fails
      localStorage.clear();
      window.location.reload();
    }
  };

  // Toggle debug options (for development)
  const handleLogoClick = () => {
    setShowDebugOptions(!showDebugOptions);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
      {/* Debug Panel - Only show when activated */}
      {showDebugOptions && user && (
        <div className="fixed top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-50 border border-gray-200">
          <div className="text-sm space-y-2">
            <div className="font-medium text-gray-800">Debug Options</div>
            <div className="text-xs text-gray-600">
              User: {user.email}<br/>
              Has Subscription: {hasActiveSubscription ? 'Yes' : 'No'}
            </div>
            <Button
              onClick={handleSignOut}
              size="sm"
              variant="outline"
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
            >
              Clear Session & Refresh
            </Button>
            <Button
              onClick={() => setShowDebugOptions(false)}
              size="sm"
              variant="outline"
              className="w-full"
            >
              Hide Debug
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo - Click to toggle debug options */}
            <div 
              className="flex items-center cursor-pointer select-none"
              onClick={handleLogoClick}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-yellow-500 rounded-lg flex items-center justify-center mr-3">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-yellow-600 bg-clip-text text-transparent">
                AskStan!
              </span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {user ? (
                <>
                  {hasActiveSubscription ? (
                    <Link
                      to="/dashboard"
                      className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                    >
                      Dashboard
                    </Link>
                  ) : (
                    <Link
                      to="/plans"
                      className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                    >
                      Plans
                    </Link>
                  )}
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    size="sm"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link
                    to="/signin"
                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link to="/signup">
                    <Button size="sm">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl font-bold text-gray-900 mb-6"
            >
              Grow Your Social Media with{' '}
              <span className="bg-gradient-to-r from-blue-600 to-yellow-600 bg-clip-text text-transparent">
                AI Coaching
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
            >
              Get personalized strategies, content ideas, and growth tactics from our AI-powered social media coach. 
              Transform your online presence and build an engaged community.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              {user ? (
                hasActiveSubscription ? (
                  <Button
                    onClick={() => navigate('/dashboard')}
                    size="lg"
                    className="flex items-center justify-center bg-gradient-to-r from-blue-600 to-yellow-600 hover:from-blue-700 hover:to-yellow-700"
                  >
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigate('/plans')}
                    size="lg"
                    className="flex items-center justify-center bg-gradient-to-r from-blue-600 to-yellow-600 hover:from-blue-700 hover:to-yellow-700"
                  >
                    Choose Your Plan
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                )
              ) : (
                <>
                  <Button
                    onClick={() => navigate('/signup')}
                    size="lg"
                    className="flex items-center justify-center bg-gradient-to-r from-blue-600 to-yellow-600 hover:from-blue-700 hover:to-yellow-700"
                  >
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <Button
                    onClick={() => navigate('/signin')}
                    variant="outline"
                    size="lg"
                  >
                    Sign In
                  </Button>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our AI-powered platform provides personalized guidance to help you build a thriving social media presence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-8 h-8" />,
                title: "AI-Powered Insights",
                description: "Get personalized recommendations based on your content, audience, and goals."
              },
              {
                icon: <Target className="w-8 h-8" />,
                title: "Strategic Planning",
                description: "Develop comprehensive social media strategies that align with your brand."
              },
              {
                icon: <TrendingUp className="w-8 h-8" />,
                title: "Growth Analytics",
                description: "Track your progress with detailed analytics and performance metrics."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="text-center p-6 rounded-xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-yellow-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Social Media?
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Join thousands of creators and businesses who are already growing with AskStan!
            </p>
            <Button
              onClick={() => navigate(user ? '/plans' : '/signup')}
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 font-semibold"
            >
              {user ? 'Choose Your Plan' : 'Get Started Today'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-yellow-500 rounded-lg flex items-center justify-center mr-3">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">AskStan!</span>
            </div>
            <p className="text-gray-400 mb-4">
              Empowering creators and businesses to grow their social media presence with AI.
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-400">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;