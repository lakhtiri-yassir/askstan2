import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { stripeService } from '../../services/stripe.service';

export const PlansPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { refreshSubscription } = useAuth();

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly Plan',
      price: '$4.99',
      period: '/month',
      description: 'Perfect for getting started',
      features: [
        'AI-powered social media coaching',
        'Multi-platform support',
        'Growth analytics dashboard',
        'Content optimization tips',
        '24/7 AI chat support',
        'Weekly growth reports'
      ],
      priceId: stripeConfig.prices.monthly,
      popular: false
    },
    {
      id: 'yearly',
      name: 'Yearly Plan',
      price: '$49.99',
      period: '/year',
      description: 'Best value - Save 17%!',
      originalPrice: '$59.88',
      features: [
        'Everything in Monthly Plan',
        'Priority AI responses',
        'Advanced analytics',
        'Custom growth strategies',
        'Monthly strategy calls',
        'Exclusive templates',
        'Advanced integrations'
      ],
      priceId: import.meta.env.VITE_STRIPE_PRICE_YEARLY,
      popular: true
    }
  ];

  const handleSubscribe = async (plan: typeof plans[0]) => {
    setIsLoading(plan.id);
    setErrors({});
    
    try {
      await stripeService.createCheckoutSession(plan.id as 'monthly' | 'yearly');
      
    } catch (error) {
      console.error('Subscription error:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to process subscription. Please try again.' });
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your <span className="bg-gradient-to-r from-blue-500 to-yellow-500 bg-clip-text text-transparent">Growth Plan</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock the full potential of AI-powered social media growth. Choose the plan that fits your needs.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className={`relative bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/20 ${
                plan.popular ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-500 to-yellow-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-1">
                    <Star className="w-4 h-4" />
                    <span>Most Popular</span>
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                
                <div className="flex items-baseline justify-center space-x-2">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
                
                {plan.originalPrice && (
                  <div className="mt-2">
                    <span className="text-gray-500 line-through text-lg">{plan.originalPrice}</span>
                    <span className="ml-2 text-green-600 font-semibold">Save 17%</span>
                  </div>
                )}
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <Check className="w-5 h-5 text-green-500" />
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}

              <Button
                onClick={() => handleSubscribe(plan)}
                isLoading={isLoading === plan.id}
                size="lg"
                className="w-full"
                variant={plan.popular ? 'primary' : 'outline'}
              >
                {isLoading === plan.id ? 'Processing...' : `Choose ${plan.name}`}
                <Zap className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mt-12"
        >
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6 max-w-2xl mx-auto border border-white/20">
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Secure payments</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};