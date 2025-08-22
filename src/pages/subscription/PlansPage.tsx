// src/pages/subscription/PlansPage.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Star, ArrowRight, Clock } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { subscriptionService } from '../../lib/subscriptionService';

export const PlansPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  
  // CRITICAL FIX: Add checkout in progress state to prevent double requests
  const [checkoutInProgress, setCheckoutInProgress] = useState(false);
  
  const { user } = useAuth();

  const handleSubscribe = async (planType: 'monthly' | 'yearly') => {
    if (!user) return;

    // CRITICAL FIX: Prevent concurrent checkout requests
    if (checkoutInProgress || isLoading) {
      console.log("⏸️ Checkout already in progress");
      return;
    }

    try {
      setIsLoading(true);
      setLoadingPlan(planType);
      setCheckoutInProgress(true);
      
      console.log("🛒 Starting checkout for plan:", planType);
      
      const checkoutUrl = await subscriptionService.createCheckoutSession(
        planType,
        user.id,
        user.email || ''
      );
      
      console.log("✅ Checkout URL received, redirecting...");
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Subscription error:', error);
      
      // CRITICAL FIX: Better error handling
      const errorMessage = error instanceof Error ? error.message : 'Failed to start subscription. Please try again.';
      alert(errorMessage);
      
      // Reset states on error
      setIsLoading(false);
      setLoadingPlan(null);
      setCheckoutInProgress(false);
    }
  };

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly Plan',
      price: '$4.99',
      period: '/month',
      popular: false,
      features: [
        'AI-powered social media coaching',
        'Multi-platform support',
        'Growth analytics dashboard',
        '24/7 AI chat support'
      ]
    },
    {
      id: 'yearly',
      name: 'Yearly Plan',
      price: '$49.99',
      period: '/year',
      popular: true,
      savings: '17% savings',
      features: [
        'All monthly features',
        'Priority AI responses',
        'Advanced analytics',
        'Custom growth strategies'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Growth Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock the power of AI-driven social media coaching and accelerate your online presence
          </p>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-white rounded-2xl shadow-xl p-8 ${
                plan.popular ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-500 to-yellow-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    Most Popular
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-center justify-center mb-2">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600 ml-1">{plan.period}</span>
                </div>
                {plan.savings && (
                  <div className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    {plan.savings}
                  </div>
                )}
              </div>

              {/* Features List */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Subscribe Button */}
              <Button
                onClick={() => handleSubscribe(plan.id as 'monthly' | 'yearly')}
                disabled={checkoutInProgress || !user}
                loading={loadingPlan === plan.id}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-blue-500 to-yellow-500 hover:from-blue-600 hover:to-yellow-600 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300'
                }`}
              >
                {loadingPlan === plan.id ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating Session...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </div>
                )}
              </Button>
            </motion.div>
          ))}
        </div>

        {/* 3-Day Trial Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-12"
        >
          <div className="inline-flex items-center bg-blue-50 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
            <Clock className="w-4 h-4 mr-2" />
            Start with a 3-day free trial • Cancel anytime
          </div>
        </motion.div>

        {/* Login Prompt */}
        {!user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-8"
          >
            <p className="text-gray-600">
              Need to sign in first?{' '}
              <a href="/signin" className="text-blue-600 hover:text-blue-800 font-medium">
                Sign In
              </a>
              {' '}or{' '}
              <a href="/signup" className="text-blue-600 hover:text-blue-800 font-medium">
                Create Account
              </a>
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};
export default PlansPage;