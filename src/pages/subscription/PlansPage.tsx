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
  const { user } = useAuth();

  const handleSubscribe = async (planType: 'monthly' | 'yearly') => {
    if (!user) return;

    try {
      setIsLoading(true);
      setLoadingPlan(planType);
      
      const checkoutUrl = await subscriptionService.createCheckoutSession(
        planType,
        user.id,
        user.email || ''
      );
      
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to start subscription. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingPlan(null);
    }
  };

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly Plan',
      price: '$19.95',
      originalPrice: null,
      interval: 'month',
      popular: false,
      savings: null,
      features: [
        'AI-powered social media coaching',
        'Write viral hooks and captions',
        'Complete LinkedIn post creation',
        'Newsletter content generation',
        'Profile optimization strategies',
        'Content repurposing for all platforms',
        'Monetization guidance',
        '24/7 AI chat support',
        'Content analysis and optimization tips'
      ]
    },
    {
      id: 'yearly',
      name: 'Annual Plan',
      price: '$143.95',
      originalPrice: '$239.40',
      interval: 'year',
      popular: true,
      savings: '40% OFF',
      features: [
        'Everything in Monthly Plan',
        'Priority AI responses',
        'Advanced analytics dashboard',
        'Custom growth strategies',
        'Exclusive monetization templates',
        'Advanced content optimization',
        'Priority customer support',
        'Early access to new features',
        'Save $95.45 per year'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-yellow-500">Growth Plan</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Start with a 3-day free trial and unlock the power of AI-driven social media growth. 
            No credit card required for trial.
          </p>
          
          {/* Trial Benefits */}
          <div className="bg-gradient-to-r from-blue-600 to-yellow-500 rounded-2xl p-6 max-w-2xl mx-auto mb-8">
            <div className="flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-white mr-2" />
              <span className="text-white font-semibold text-lg">3-Day Free Trial Includes:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white text-sm">
              <div className="flex items-center">
                <Check className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>Full AI Coach Access</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>All Content Creation Tools</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>No Credit Card Required</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className={`relative rounded-2xl p-8 shadow-xl border-2 transition-all duration-300 hover:shadow-2xl ${
                plan.popular
                  ? 'bg-gradient-to-br from-blue-600 to-yellow-500 text-white border-transparent'
                  : 'bg-white border-gray-200 hover:border-blue-300'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="bg-yellow-400 text-blue-900 px-6 py-2 rounded-full text-sm font-bold flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    MOST POPULAR
                  </div>
                </div>
              )}

              {/* Savings Badge */}
              {plan.savings && (
                <div className="absolute top-4 right-4 bg-yellow-400 text-blue-900 px-3 py-1 rounded-full text-sm font-bold">
                  {plan.savings}
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className={`text-2xl font-bold mb-4 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                
                <div className="mb-4">
                  {plan.originalPrice && (
                    <div className={`text-lg line-through ${plan.popular ? 'text-white/70' : 'text-gray-500'}`}>
                      {plan.originalPrice}
                    </div>
                  )}
                  <div className={`text-5xl font-black mb-2 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price}
                  </div>
                  <p className={`${plan.popular ? 'text-white/90' : 'text-gray-600'}`}>
                    per {plan.interval}
                  </p>
                </div>

                <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  plan.popular 
                    ? 'bg-white/20 backdrop-blur-sm text-white' 
                    : 'bg-blue-50 text-blue-700'
                }`}>
                  3-Day Free Trial
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <Check className={`w-5 h-5 mr-3 flex-shrink-0 mt-0.5 ${
                      plan.popular ? 'text-yellow-300' : 'text-green-500'
                    }`} />
                    <span className={`${plan.popular ? 'text-white' : 'text-gray-700'} ${
                      feature.includes('Save') || feature.includes('Everything') ? 'font-semibold' : ''
                    }`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                size="lg"
                onClick={() => handleSubscribe(plan.id as 'monthly' | 'yearly')}
                disabled={isLoading}
                className={`w-full ${
                  plan.popular
                    ? 'bg-white text-blue-600 hover:bg-gray-100 font-semibold'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isLoading && loadingPlan === plan.id ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : null}
                {isLoading && loadingPlan === plan.id ? 'Starting Trial...' : 'Start 3-Day Free Trial'}
                {!isLoading && <ArrowRight className="ml-2 w-5 h-5" />}
              </Button>
            </motion.div>
          ))}
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-20 max-w-3xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="font-semibold text-gray-900 mb-2">What happens after my 3-day trial?</h3>
              <p className="text-gray-600">
                After your trial ends, you'll be automatically enrolled in your chosen plan. You can cancel anytime before the trial ends with no charges.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Can I change plans later?</h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time through your account settings or by contacting support.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Is there a refund policy?</h3>
              <p className="text-gray-600">
                While subscription fees are generally non-refundable, we're committed to your satisfaction. Contact us at reply@askstan.io if you have concerns.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center mt-16"
        >
          <p className="text-gray-600 mb-4">
            Questions about our plans? Contact us at{' '}
            <a href="mailto:reply@askstan.io" className="text-blue-600 hover:text-blue-700 font-semibold">
              reply@askstan.io
            </a>
          </p>
          <p className="text-sm text-gray-500">
            No credit card required for trial • Cancel anytime • 100% satisfaction guarantee
          </p>
        </motion.div>
      </div>
    </div>
  );
};