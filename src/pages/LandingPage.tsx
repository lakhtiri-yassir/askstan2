// src/pages/LandingPage.tsx - CLEAN SPLIT LAYOUT: Banner right, content left, white background
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Check, Sparkles, TrendingUp, Users, MessageSquare, MessageCircle, RotateCcw } from 'lucide-react';
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
    <div className="min-h-screen bg-white">
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

      {/* HERO SECTION - Split Layout */}
      <section className="min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-screen py-20">
            
            {/* LEFT SIDE - Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              {/* Main Heading with Gradient */}
              <div>
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-6xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-yellow-500 bg-clip-text text-transparent"
                >
                  AskStan!
                </motion.h1>

                {/* Tagline */}
                <motion.h2
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-8"
                >
                  Your On-Demand Social Media Growth Coach
                </motion.h2>
              </div>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="space-y-6"
              >
                <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                  Meet Stan, your AI-powered social media strategist who delivers personalized insights and proven growth tactics 24/7. 
                  Specializing in LinkedIn optimization, content strategy, and audience engagement.
                </p>
              </motion.div>

              {/* Key Features */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="space-y-4"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">LinkedIn Mastery</h3>
                    <p className="text-gray-600">Unlock LinkedIn's potential with AI-driven content strategies and networking tactics.</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Content Intelligence</h3>
                    <p className="text-gray-600">Get instant content ideas, optimization tips, and engagement strategies.</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Growth Analytics</h3>
                    <p className="text-gray-600">Track your progress with detailed insights and performance metrics.</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* RIGHT SIDE - AskStan Banner */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex justify-center lg:justify-end"
            >
              <img
                src={askstanBanner}
                alt="AskStan! AI Social Media Coach"
                className="w-full max-w-lg lg:max-w-xl xl:max-w-2xl object-contain drop-shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* PLANS SECTION - With Gradient Cards */}
      <section className="py-20 bg-gray-50">
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
            {/* Monthly Plan - With Gradient */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600 rounded-3xl p-8 text-white hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Monthly Plan</h3>
                <div className="flex items-center justify-center mb-4">
                  <span className="text-5xl font-bold">$19.95</span>
                  <span className="text-xl opacity-90 ml-2">/month</span>
                </div>
                <p className="opacity-90">Perfect for getting started</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-300 mr-3 flex-shrink-0" />
                  <span>24/7 AI coaching with Stan</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-300 mr-3 flex-shrink-0" />
                  <span>LinkedIn optimization strategies</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-300 mr-3 flex-shrink-0" />
                  <span>Content creation guidance</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-300 mr-3 flex-shrink-0" />
                  <span>Growth analytics dashboard</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-300 mr-3 flex-shrink-0" />
                  <span>Multi-platform support</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-300 mr-3 flex-shrink-0" />
                  <span>Unlimited AI conversations</span>
                </li>
              </ul>

              <Button
                onClick={() => navigate(user ? '/plans' : '/signup')}
                className="w-full py-3 bg-white text-blue-600 hover:bg-gray-100 font-semibold rounded-xl transition-all duration-300"
              >
                {user ? 'Select Plan' : 'Get Started'}
              </Button>
            </motion.div>

            {/* Yearly Plan - With Gradient and Popular Badge */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-yellow-500 via-orange-500 to-yellow-600 rounded-3xl p-8 text-white relative hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
            >
              {/* Popular Badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-white text-orange-600 px-6 py-2 rounded-full text-sm font-bold flex items-center shadow-lg">
                  <Star className="w-4 h-4 mr-2" />
                  Most Popular
                </div>
              </div>

              <div className="text-center mb-8 mt-4">
                <h3 className="text-2xl font-bold mb-2">Yearly Plan</h3>
                <div className="flex items-center justify-center mb-2">
                  <span className="text-5xl font-bold">$143.95</span>
                  <span className="text-xl opacity-90 ml-2">/year</span>
                </div>
                <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold">
                  Save $95.45 annually
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-300 mr-3 flex-shrink-0" />
                  <span>24/7 AI coaching with Stan</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-300 mr-3 flex-shrink-0" />
                  <span>LinkedIn optimization strategies</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-300 mr-3 flex-shrink-0" />
                  <span>Content creation guidance</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-300 mr-3 flex-shrink-0" />
                  <span>Growth analytics dashboard</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-300 mr-3 flex-shrink-0" />
                  <span>Multi-platform support</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-300 mr-3 flex-shrink-0" />
                  <span>Unlimited AI conversations</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-300 mr-3 flex-shrink-0" />
                  <span className="font-semibold">Same features, better value!</span>
                </li>
              </ul>

              <Button
                onClick={() => navigate(user ? '/plans' : '/signup')}
                className="w-full py-3 bg-white text-orange-600 hover:bg-gray-100 font-semibold rounded-xl transition-all duration-300"
              >
                {user ? 'Select Plan' : 'Get Started'}
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