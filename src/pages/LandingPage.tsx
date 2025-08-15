// src/pages/LandingPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
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
import askstanBanner from '../img/askstanbanner.png';

export const LandingPage: React.FC = () => {
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
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-yellow-500">
                  AskStan!
                </span>
                <br />
                <span className="text-3xl md:text-4xl font-bold text-gray-700">
                  Your On-Demand Social Media Growth Coach
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Get AI-powered social media strategies, content creation, and monetization guidance 
                to transform your online presence into a revenue-generating machine.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-8">
                <Link to="/signup">
                  <Button size="xl" className="px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                    Start Your 3-Day Free Trial
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <p className="text-sm text-gray-500">
                  No credit card required • Cancel anytime
                </p>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center lg:justify-start items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-500 mr-1" />
                  <span>AI-Powered Strategies</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-1" />
                  <span>Proven Results</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 text-blue-500 mr-1" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative flex justify-center"
            >
              <img
                src={askstanBanner}
                alt="AskStan! AI Social Media Coach"
                className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 object-contain"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* What AskStan! Can Do Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              What <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-yellow-500">AskStan!</span> Can Do
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Your personal AI coach for social media growth, content creation, and audience monetization
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
                className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-yellow-500 rounded-2xl mb-6">
                  <capability.icon className="w-8 h-8 text-white" />
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
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50">
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
              Start with a 3-day free trial, then choose the plan that works for you
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Monthly Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200 relative"
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Monthly Plan</h3>
                <div className="text-5xl font-black text-gray-900 mb-2">
                  $19<span className="text-2xl text-gray-500">.95</span>
                </div>
                <p className="text-gray-600">per month</p>
                <div className="mt-4 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium">
                  3-Day Free Trial
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">AI-powered social media coaching</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Content creation for all platforms</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Profile optimization strategies</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Monetization guidance</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">24/7 AI chat support</span>
                </li>
              </ul>

              <Link to="/signup" className="block">
                <Button size="lg" className="w-full">
                  Start Free Trial
                </Button>
              </Link>
            </motion.div>

            {/* Annual Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-blue-600 to-yellow-500 rounded-2xl p-8 shadow-xl text-white relative overflow-hidden"
            >
              <div className="absolute top-4 right-4 bg-yellow-400 text-blue-900 px-3 py-1 rounded-full text-sm font-bold">
                40% OFF
              </div>

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Annual Plan</h3>
                <div className="text-5xl font-black mb-2">
                  $143<span className="text-2xl opacity-80">.95</span>
                </div>
                <p className="opacity-90">per year</p>
                <div className="mt-4 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium">
                  3-Day Free Trial + Save 40%
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-yellow-300 mr-3 flex-shrink-0" />
                  <span>Everything in Monthly Plan</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-yellow-300 mr-3 flex-shrink-0" />
                  <span>Priority AI responses</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-yellow-300 mr-3 flex-shrink-0" />
                  <span>Advanced analytics</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-yellow-300 mr-3 flex-shrink-0" />
                  <span>Custom growth strategies</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-yellow-300 mr-3 flex-shrink-0" />
                  <span className="font-semibold">Save $95.45 per year</span>
                </li>
              </ul>

              <Link to="/signup" className="block">
                <Button 
                  size="lg" 
                  variant="white"
                  className="w-full"
                >
                  Start Free Trial
                </Button>
              </Link>
            </motion.div>
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-600">
              No credit card required for trial • Cancel anytime • 100% satisfaction guarantee
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-yellow-500">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Social Media?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of creators and entrepreneurs who are using AskStan! to grow their audience and revenue.
            </p>
            
            <Link to="/signup">
              <Button 
                size="xl" 
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold shadow-lg"
              >
                Start Your Free 3-Day Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            
            <p className="text-white/80 mt-4 text-sm">
              No credit card required • Full access during trial
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};