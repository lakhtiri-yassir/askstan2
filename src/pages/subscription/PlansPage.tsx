// src/pages/subscription/PlansPage.tsx - NO COUPON FUNCTIONALITY
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Star, ArrowRight, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { subscriptionService } from '../../lib/subscriptionService';

const PlansPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [checkoutInProgress, setCheckoutInProgress] = useState(false);
  
  const { user } = useAuth();

  const handleSubscribe = async (planType: 'monthly' | 'yearly') => {
    if (!user) return;

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
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to start subscription. Please try again.';
      alert(errorMessage);
      
      setIsLoading(false);
      setLoadingPlan(null);
      setCheckoutInProgress(false);
    }
  };

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly Plan',
      price: '$19.95',
      period: '/month',
      popular: false,
      description: 'Perfect for getting started',
      features: [
        '24/7 AI coaching with Stan',
        'LinkedIn optimization strategies',
        'Content creation guidance',
        'Growth analytics dashboard',
        'Multi-platform support',
        'Unlimited AI conversations'
      ]
    },
    {
      id: 'yearly',
      name: 'Yearly Plan', 
      price: '$143.95',
      period: '/year',
      popular: true,
      savings: 'Save $95.45 annually',
      description: 'Best value - same features, lower cost',
      features: [
        '24/7 AI coaching with Stan',
        'LinkedIn optimization strategies', 
        'Content creation guidance',
        'Growth analytics dashboard',
        'Multi-platform support',
        'Unlimited AI conversations'
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
          <p className="text-lg text-gray-500 mt-4">
            Both plans include the exact same features - yearly is just more affordable!
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
                plan.popular 
                  ? 'border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50' 
                  : 'border border-gray-200'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-2 rounded-full text-sm font-bold flex items-center shadow-lg">
                    <Star className="w-4 h-4 mr-2" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <div className="flex items-center justify-center mb-4">
                  <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-xl text-gray-600 ml-2">{plan.period}</span>
                </div>
                {plan.savings && (
                  <div className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
                    {plan.savings}
                  </div>
                )}
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id as 'monthly' | 'yearly')}
                disabled={isLoading}
                className={`w-full py-3 font-semibold rounded-xl transition-all duration-300 inline-flex items-center justify-center ${
                  plan.popular
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg transform hover:-translate-y-1'}`}
              >
                {isLoading && loadingPlan === plan.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>Starting subscription...</span>
                  </>
                ) : (
                  <>
                    <span>Get Started Now</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-12 space-y-4"
        >
          <p className="text-gray-600">
            ✅ Cancel anytime • ✅ Secure payment via Stripe • ✅ Instant access
          </p>
          <p className="text-sm text-gray-500">
            Both plans give you complete access to all AskStan features. Choose yearly to save money!
          </p>
          <p className="text-sm text-blue-600 font-medium">
            💡 Have a coupon? Enter it during checkout for instant savings!
          </p>
        </motion.div>

        {/* Money Back Guarantee */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-blue-50 rounded-2xl p-6 text-center mt-8"
        >
          <div className="flex items-center justify-center mb-3">
            <div className="bg-blue-100 rounded-full p-3">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            30-Day Money Back Guarantee
          </h3>
          <p className="text-gray-600">
            Not satisfied? Get a full refund within 30 days, no questions asked.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default PlansPage;