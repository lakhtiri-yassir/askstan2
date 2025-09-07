// src/pages/subscription/PlansPage.tsx - UPDATED PRICING
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { subscriptionService } from '../../lib/subscriptionService';

export const PlansPage: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [checkoutInProgress, setCheckoutInProgress] = useState(false);

  const handlePlanSelection = async (planType: 'monthly' | 'yearly') => {
    if (!user) {
      // Redirect to signup if not authenticated
      window.location.href = '/signup';
      return;
    }

    if (checkoutInProgress) {
      console.log('⏳ Checkout already in progress, ignoring click');
      return;
    }

    try {
      setIsLoading(true);
      setLoadingPlan(planType);
      setCheckoutInProgress(true);

      console.log('🚀 Starting checkout process for:', planType);
      
      const checkoutUrl = await subscriptionService.createCheckoutSession(
        planType,
        user.id,
        user.email || ''
      );

      console.log('✅ Redirecting to checkout:', checkoutUrl);
      window.location.href = checkoutUrl;

    } catch (error: any) {
      console.error('❌ Checkout error:', error);
      
      // User-friendly error message
      const errorMessage = error.message || 'Failed to start subscription. Please try again.';
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
                  ? 'ring-2 ring-blue-500 transform scale-105' 
                  : 'border border-gray-200'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-full text-sm font-bold flex items-center space-x-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Most Popular</span>
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="text-5xl font-black text-gray-900 mb-2">
                  {plan.price}
                  <span className="text-lg font-normal text-gray-600">{plan.period}</span>
                </div>
                {plan.savings && (
                  <div className="text-green-600 font-semibold text-sm bg-green-50 inline-block px-3 py-1 rounded-full">
                    {plan.savings}
                  </div>
                )}
                <p className="text-gray-600 mt-2">{plan.description}</p>
              </div>

              {/* Features List */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                onClick={() => handlePlanSelection(plan.id as 'monthly' | 'yearly')}
                disabled={isLoading}
                className={`w-full py-4 text-lg font-semibold rounded-xl transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loadingPlan === plan.id ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </div>
                )}
              </Button>

              {/* Monthly billing note */}
              <p className="text-center text-sm text-gray-500 mt-4">
                {plan.id === 'yearly' ? 'Billed annually' : 'Billed monthly'} • Cancel anytime
              </p>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-gray-600 mb-4">
            Not ready to commit? No problem!
          </p>
          <Link to="/">
            <Button variant="outline" className="px-6 py-3">
              Learn More About AskStan!
            </Button>
          </Link>
        </motion.div>

        {/* Trust Signals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-12 pt-8 border-t border-gray-200"
        >
          <p className="text-sm text-gray-500 mb-4">
            ✓ Secure payment processing by Stripe
          </p>
          <p className="text-sm text-gray-500">
            ✓ Cancel anytime, no questions asked
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default PlansPage;