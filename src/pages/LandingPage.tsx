// src/pages/LandingPage.tsx - ADDED: Session clear functionality while keeping original design
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Target, TrendingUp, Star, MessageCircle, RotateCcw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

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
      // Force clear all storage
      localStorage.clear();
      sessionStorage.clear();
      // Reload page to ensure clean state
      window.location.reload();
    } catch (error) {
      addDebugLog('❌ Clear session error', error);
      // Force clear even if signOut fails
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
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

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
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
                    onClick={handleClearSession}
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

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button className="text-gray-700 hover:text-blue-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
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

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Thousands of Creators
            </h2>
            <p className="text-xl text-gray-600">
              See what our users are saying about their growth journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Content Creator",
                content: "AskStan! helped me grow my Instagram following by 300% in just 3 months. The AI insights are incredible!",
                rating: 5
              },
              {
                name: "Mike Chen",
                role: "Small Business Owner",
                content: "The strategic planning feature completely transformed how I approach social media for my business.",
                rating: 5
              },
              {
                name: "Emily Rodriguez",
                role: "Influencer",
                content: "I've tried many tools, but AskStan!'s personalized coaching is on another level. Highly recommend!",
                rating: 5
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-gray-600 text-sm">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 bg-white/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Choose the plan that works best for your growth goals
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold mb-2">Monthly</h3>
              <p className="text-3xl font-bold text-blue-600 mb-4">$4.99<span className="text-lg text-gray-600">/month</span></p>
              <p className="text-gray-600">Perfect for getting started</p>
            </div>
            <div className="bg-gradient-to-r from-blue-600 to-yellow-600 p-6 rounded-xl text-white relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-yellow-400 text-blue-900 px-3 py-1 rounded-full text-sm font-semibold">
                  Best Value
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Yearly</h3>
              <p className="text-3xl font-bold mb-4">$49.99<span className="text-lg opacity-90">/year</span></p>
              <p className="opacity-90">Save 17% with annual billing</p>
            </div>
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
                <li><Link to="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/plans" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/demo" className="hover:text-white transition-colors">Demo</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 AskStan!. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;