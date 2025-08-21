// src/pages/LandingPage.tsx - FIXED: Added proper auth-based redirects using React Router
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  MessageSquare, 
  FileText, 
  Users, 
  TrendingUp, 
  Repeat, 
  DollarSign, 
  BarChart3,
  Check,
  Star
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import askstanBanner from '../img/askstanbanner.png';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasActiveSubscription, loading, initialized } = useAuth();

  // CRITICAL FIX: Handle auth-based redirects properly using React Router
  useEffect(() => {
    // Only redirect once auth is fully initialized and not loading
    if (!initialized || loading) {
      return;
    }

    // If user is signed in, redirect based on subscription status
    if (user) {
      console.log('🔍 LandingPage: User detected, checking subscription status', {
        hasActiveSubscription,
        userEmail: user.email
      });

      // Small delay to ensure subscription data is fully loaded
      const redirectTimer = setTimeout(() => {
        if (hasActiveSubscription) {
          console.log('✅ User has active subscription, redirecting to dashboard');
          navigate('/dashboard', { replace: true });
        } else {
          console.log('💳 User needs subscription, redirecting to plans');
          navigate('/plans', { replace: true });
        }
      }, 500); // Small delay to ensure subscription status is determined

      return () => clearTimeout(redirectTimer);
    } else {
      console.log('ℹ️ LandingPage: No user, showing landing page');
    }
  }, [user, hasActiveSubscription, initialized, loading, navigate]);

  const capabilities = [
    {
      icon: MessageSquare,
      title: "Write Viral Hooks",
      description: "Stop the scroll and spark engagement with hooks that captivate your audience"
    },
    {
      icon: FileText,
      title: "Complete LinkedIn Posts",
      description: "Transform your topics and ideas into compelling LinkedIn content that drives results"
    },
    {
      icon: Users,
      title: "Newsletter Articles",
      description: "Create newsletter content designed to convert readers into paying customers"
    },
    {
      icon: TrendingUp,
      title: "LinkedIn Profile Optimization",
      description: "Turn your LinkedIn profile into a high-converting landing page that works 24/7"
    },
    {
      icon: Repeat,
      title: "Content Repurposing",
      description: "Adapt your content for LinkedIn, X, Instagram, and Threads to maximize reach"
    },
    {
      icon: DollarSign,
      title: "Monetization Strategies",
      description: "Get proven strategies to turn your engaged audience into paying clients"
    },
    {
      icon: BarChart3,
      title: "Content Analysis & Optimization",
      description: "Analyze your content performance and get specific tips to improve reach and visibility"
    }
  ];

  // Show loading spinner while auth is initializing
  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Only render landing page content if user is not signed in
  // If user is signed in, the useEffect will handle the redirect
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
            >
              <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 via-purple-600 via-pink-500 to-orange-400">
                  AskStan!
                </span>
                <br />
                Your Personal
                <br />
                <span className="text-blue-600">
                  AI Coach
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
                Transform your social media presence with AI-powered strategies that 
                <span className="text-blue-600 font-semibold"> drive real engagement </span>
                and grow your audience authentically.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/signup">
                  <Button size="lg" className="w-full sm:w-auto">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/signin">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Sign In
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative bg-white rounded-2xl shadow-2xl p-8 backdrop-blur-sm bg-white/80">
                <img 
                  src={askstanBanner} 
                  alt="AskStan AI Dashboard Preview" 
                  className="w-full h-auto rounded-lg shadow-lg"
                />
                <div className="absolute -top-4 -right-4 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                  🔥 AI-Powered
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              What Can <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">AskStan!</span> Do For You?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From viral content creation to profile optimization, AskStan! provides personalized AI coaching 
              to elevate your social media game and grow your business.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {capabilities.map((capability, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl p-4 w-fit mb-6">
                  <capability.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {capability.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {capability.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your growth goals
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Monthly Plan */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200"
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Monthly Plan</h3>
                <div className="text-4xl font-black text-blue-600 mb-4">
                  $4.99<span className="text-lg text-gray-500 font-normal">/month</span>
                </div>
                <ul className="text-left space-y-3 mb-8">
                  {[
                    'AI-powered social media coaching',
                    'Multi-platform content strategies', 
                    'Growth analytics dashboard',
                    '24/7 AI chat support'
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup" className="block">
                  <Button className="w-full" size="lg">
                    Start Monthly Plan
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Yearly Plan */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 shadow-xl text-white relative overflow-hidden"
            >
              <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">
                Save 17%
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Yearly Plan</h3>
                <div className="text-4xl font-black mb-4">
                  $49.99<span className="text-lg font-normal opacity-80">/year</span>
                </div>
                <ul className="text-left space-y-3 mb-8">
                  {[
                    'Everything in Monthly Plan',
                    'Priority AI responses',
                    'Advanced analytics',
                    'Custom growth strategies'
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <Star className="w-5 h-5 text-yellow-400 mr-3 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup" className="block">
                  <Button variant="outline" className="w-full border-white text-white hover:bg-white hover:text-blue-600" size="lg">
                    Start Yearly Plan
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Ready to Transform Your Social Media Presence?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of creators and businesses who are already growing their audience 
              with AI-powered strategies from AskStan!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/signin">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

// Export as named export to match the import in App.tsx
export default LandingPage;