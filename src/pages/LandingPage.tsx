// src/pages/LandingPage.tsx - PREMIUM REDESIGN: Gradient-focused with banner and plans at bottom
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Check, Sparkles, TrendingUp, Users, MessageSquare, RotateCcw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import askstanBanner from '../img/askstanbanner.png';

const LandingPage: React.FC = () => {
  const { user, hasActiveSubscription, signOut, addDebugLog } = useAuth();
  const navigate = useNavigate();
  const [showClearButton, setShowClearButton] = useState(false);

  // Show clear session button if user has subscription loading issues
  useEffect(() => {
    if (user) {
      addDebugLog('🔍 LandingPage: User detected, checking subscription status', {
        hasActiveSubscription,
        userEmail: user.email
      });

      // Show clear session button after 3 seconds if subscription hasn't loaded
      const timer = setTimeout(() => {
        if (!hasActiveSubscription) {
          setShowClearButton(true);
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [user, hasActiveSubscription, addDebugLog]);

  // Clear session function
  const handleClearSession = async () => {
    try {
      addDebugLog('🧹 LandingPage: Clearing session storage');
      await signOut();
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } catch (error) {
      addDebugLog('❌ Clear session error', error);
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen">
      {/* Clear Session Button - Fixed position, only show when needed */}
      {showClearButton && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <Button
            onClick={handleClearSession}
            className="bg-red-500 hover:bg-red-600 text-white shadow-lg flex items-center space-x-2"
            size="sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear Session</span>
          </Button>
        </motion.div>
      )}

      {/* PREMIUM HERO SECTION - Full gradient background */}
      <section className="relative min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-yellow-500 overflow-hidden">
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/90 via-purple-500/90 to-yellow-500/90 animate-gradient-xy"></div>
        
        {/* Floating elements for premium feel */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -left-4 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 -right-8 w-96 h-96 bg-yellow-300/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-purple-300/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Navigation - Minimal and clean */}
          <nav className="w-full px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <Link to="/" className="flex items-center">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-3 border border-white/30">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">
                  AskStan!
                </span>
              </Link>

              <div className="hidden md:flex items-center space-x-6">
                {user ? (
                  <>
                    {hasActiveSubscription ? (
                      <Link
                        to="/dashboard"
                        className="text-white/90 hover:text-white font-medium transition-colors"
                      >
                        Dashboard
                      </Link>
                    ) : (
                      <Link
                        to="/plans"
                        className="text-white/90 hover:text-white font-medium transition-colors"
                      >
                        Plans
                      </Link>
                    )}
                    <Button
                      onClick={handleClearSession}
                      variant="outline"
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/signin"
                      className="text-white/90 hover:text-white font-medium transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link to="/signup">
                      <Button 
                        size="sm"
                        className="bg-white text-blue-600 hover:bg-white/90 font-semibold"
                      >
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto text-center">
              {/* AskStan Banner */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="mb-8"
              >
                <img
                  src={askstanBanner}
                  alt="AskStan! AI Social Media Coach"
                  className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 object-contain mx-auto drop-shadow-2xl"
                />
              </motion.div>

              {/* Main Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 tracking-tight"
              >
                AskStan!
              </motion.h1>

              {/* Tagline */}
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-2xl md:text-3xl lg:text-4xl font-bold text-white/95 mb-8"
              >
                Your On-Demand Social Media Growth Coach
              </motion.h2>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="max-w-4xl mx-auto mb-12"
              >
                <p className="text-xl md:text-2xl text-white/90 leading-relaxed mb-8">
                  Meet Stan, your AI-powered social media strategist who delivers personalized insights and proven growth tactics 24/7. 
                  Specializing in LinkedIn optimization, content strategy, and audience engagement - Stan transforms your social media presence 
                  from ordinary to extraordinary.
                </p>
                
                {/* Key Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                  >
                    <TrendingUp className="w-8 h-8 text-yellow-300 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-white mb-2">LinkedIn Mastery</h3>
                    <p className="text-white/80 text-sm">Unlock LinkedIn's potential with AI-driven content strategies and networking tactics.</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.0 }}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                  >
                    <Sparkles className="w-8 h-8 text-purple-300 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-white mb-2">Content Intelligence</h3>
                    <p className="text-white/80 text-sm">Get instant content ideas, optimization tips, and engagement strategies.</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.2 }}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                  >
                    <Users className="w-8 h-8 text-blue-300 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-white mb-2">Growth Analytics</h3>
                    <p className="text-white/80 text-sm">Track your progress with detailed insights and performance metrics.</p>
                  </motion.div>
                </div>
              </motion.div>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.4 }}
              >
                <Button
                  onClick={() => navigate(user ? '/plans' : '/signup')}
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-white/90 font-bold text-xl px-12 py-4 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  {user ? 'Choose Your Plan' : 'Start Growing Today'}
                  <ArrowRight className="w-6 h-6 ml-3" />
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 2 }}
            className="text-center pb-8"
          >
            <div className="inline-flex flex-col items-center text-white/60">
              <span className="text-sm mb-2">Discover Our Plans</span>
              <div className="w-1 h-8 bg-white/30 rounded-full animate-pulse"></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* PLANS SECTION - Premium cards at bottom */}
      <section className="py-20 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Choose Your Growth Path
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Start your social media transformation with Stan's AI-powered coaching. 
              Pick the plan that fits your ambitions.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Monthly Plan */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1"
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Monthly Plan</h3>
                <div className="flex items-center justify-center mb-4">
                  <span className="text-5xl font-bold text-blue-600">$4.99</span>
                  <span className="text-xl text-gray-600 ml-2">/month</span>
                </div>
                <p className="text-gray-600">Perfect for getting started</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">24/7 AI coaching with Stan</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">LinkedIn optimization strategies</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Content creation guidance</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Growth analytics dashboard</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Multi-platform support</span>
                </li>
              </ul>

              <Button
                onClick={() => navigate(user ? '/plans' : '/signup')}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-300"
              >
                {user ? 'Select Plan' : 'Start Free Trial'}
              </Button>
            </motion.div>

            {/* Yearly Plan - Featured */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl p-8 border-2 border-yellow-400 relative hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
            >
              {/* Popular Badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-2 rounded-full text-sm font-bold flex items-center shadow-lg">
                  <Star className="w-4 h-4 mr-2" />
                  Most Popular
                </div>
              </div>

              <div className="text-center mb-8 mt-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Yearly Plan</h3>
                <div className="flex items-center justify-center mb-2">
                  <span className="text-5xl font-bold text-orange-600">$49.99</span>
                  <span className="text-xl text-gray-600 ml-2">/year</span>
                </div>
                <div className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
                  Save 17% annually
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Everything in Monthly Plan</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Priority AI response times</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Advanced analytics & reporting</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Custom growth strategies</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Exclusive strategy updates</span>
                </li>
              </ul>

              <Button
                onClick={() => navigate(user ? '/plans' : '/signup')}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg"
              >
                {user ? 'Select Plan' : 'Start Free Trial'}
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-yellow-500 rounded-lg flex items-center justify-center mr-3">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">AskStan!</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Empowering creators and businesses to grow their social media presence with AI-powered coaching and personalized strategies.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/plans" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/#features" className="hover:text-white transition-colors">Features</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 AskStan!. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;