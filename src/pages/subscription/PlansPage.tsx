import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Star, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { subscriptionService } from '../../lib/subscriptionService';

export const PlansPage: React.FC = () => {
  const { user, subscriptionStatus, refreshSubscription } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [couponCode, setCouponCode] = useState('');
const [couponValidation, setCouponValidation] = useState<{
  valid: boolean;
  discount?: string;
  error?: string;
} | null>(null);
const [showCouponInput, setShowCouponInput] = useState(false);

// Add coupon validation function
const validateCoupon = async (code: string) => {
  if (!code.trim()) {
    setCouponValidation(null);
    return;
  }

  try {
    const result = await subscriptionService.validateCoupon(code.trim().toUpperCase());
    setCouponValidation(result);
  } catch (error) {
    setCouponValidation({
      valid: false,
      error: 'Unable to validate coupon'
    });
  }
};

  const plansConfig = subscriptionService.getPlansConfig();
  const plans = [
    { 
      ...plansConfig.monthly, 
      popular: false,
      displayPrice: plansConfig.monthly.price,
      displayPeriod: '/month'
    },
    { 
      ...plansConfig.yearly, 
      popular: true,
      displayPrice: plansConfig.yearly.price,
      displayPeriod: '/year',
      originalPrice: '$59.88'
    }
  ];

  const handleSubscribe = async (plan: any) => {
  if (!user) {
    navigate('/signin');
    return;
  }

  setIsLoading(plan.id);
  setErrors({});
  
  try {
    console.log('Creating checkout session for plan:', plan.id, 'with coupon:', couponCode);
    
    const result = await subscriptionService.createStripeCheckout(
      user.id, 
      plan.id as 'monthly' | 'yearly',
      couponCode.trim() || undefined
    );
    
    console.log('Checkout result:', result);
    
    // If payment is not required (100% off coupon), we might handle it differently
    if (!result.paymentRequired) {
      console.log('No payment required - free subscription activated');
        
        // Refresh subscription status
        await refreshSubscription();
        
        // Redirect to dashboard with success message
        if (result.redirectUrl) {
          window.location.href = result.redirectUrl;
        } else {
          navigate('/dashboard?coupon_success=true');
        }
        return;
    }
    
    // Redirect to Stripe checkout
    await subscriptionService.redirectToCheckout(result.sessionId);
    
  } catch (error) {
    console.error('Subscription error:', error);
    setErrors({ 
      [plan.id]: error instanceof Error ? error.message : 'Failed to start checkout. Please try again.' 
    });
  } finally {
    setIsLoading(null);
  }
};

  // Show current subscription status if user has one
  const currentSubscription = subscriptionStatus?.subscription;

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
            Choose Your <span className="text-powder-blue">Growth Plan</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock the full potential of AI-powered social media growth. Choose the plan that fits your needs.
          </p>
        </motion.div>

        {/* Current Subscription Status */}
        {currentSubscription && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-6"
          >
            <h3 className="font-semibold text-blue-900 mb-2">Current Subscription</h3>
            <p className="text-blue-800">
              You have an {currentSubscription.status} {currentSubscription.plan_type} subscription.
            </p>
          </motion.div>
        )}
        

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className={`relative bg-white rounded-2xl shadow-xl p-8 border border-gray-200 ${
                plan.popular ? 'ring-2 ring-navy-blue' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-navy-blue text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-1">
                    <Star className="w-4 h-4" />
                    <span>Most Popular</span>
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                
                <div className="flex items-baseline justify-center space-x-2">
                  <span className="text-4xl font-bold text-gray-900">{plan.displayPrice}</span>
                  <span className="text-gray-600">{plan.displayPeriod}</span>
                </div>
                
                {plan.originalPrice && plan.savings && (
                  <div className="mt-2">
                    <span className="text-gray-500 line-through text-lg">{plan.originalPrice}</span>
                    <span className="ml-2 text-green-600 font-semibold">{plan.savings}</span>
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

              {errors[plan.id] && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-600">{errors[plan.id]}</p>
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