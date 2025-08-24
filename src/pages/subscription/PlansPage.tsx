// src/pages/subscription/PlansPage.tsx - WITH COUPON VALIDATION
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Star, ArrowRight, Clock, Tag } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { subscriptionService } from '../../lib/subscriptionService';

const PlansPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [checkoutInProgress, setCheckoutInProgress] = useState(false);
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: string; is100Percent: boolean } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  
  const { user } = useAuth();

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setValidatingCoupon(true);
    setCouponError('');

    try {
      const result = await subscriptionService.validateCoupon(couponCode);
      
      if (result.valid) {
        setAppliedCoupon({ 
          code: couponCode.trim().toUpperCase(), 
          discount: result.discount!,
          is100Percent: result.discount === '100%'
        });
        setCouponCode('');
        setCouponError('');
      } else {
        setCouponError(result.error || 'Invalid coupon code');
      }
    } catch (err) {
      setCouponError('Failed to validate coupon. Please try again.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

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
      
      console.log("🛒 Starting checkout for plan:", planType, "with coupon:", appliedCoupon?.code);
      
      const checkoutUrl = await subscriptionService.createCheckoutSession(
        planType,
        user.id,
        user.email || '',
        appliedCoupon?.code
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
      originalPrice: 19.95,
      price: appliedCoupon?.is100Percent ? 0 : 19.95,
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
      originalPrice: 143.95,
      price: appliedCoupon?.is100Percent ? 0 : 143.95,
      period: '/year',
      popular: true,
      savings: appliedCoupon?.is100Percent ? null : 'Save $95.45 annually',
      description: appliedCoupon?.is100Percent ? 'FREE with your coupon!' : 'Best value - same features, lower cost',
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
          className="text-center mb-8"
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

        {/* Coupon Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-md mx-auto mb-8"
        >
          {appliedCoupon ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 rounded-full p-2">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-800">
                      Coupon Applied: {appliedCoupon.code}
                    </p>
                    <p className="text-sm text-green-600">
                      {appliedCoupon.discount} discount
                      {appliedCoupon.is100Percent && (
                        <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">
                          COMPLETELY FREE!
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-green-600 hover:text-green-700 px-2 py-1 rounded"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Tag className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Have a coupon code?</span>
              </div>
              
              <div className="flex space-x-2">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      setCouponError('');
                    }}
                    disabled={validatingCoupon}
                    className={`w-full px-4 py-3 bg-white border-2 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all duration-200 placeholder-gray-400 text-gray-900 ${couponError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-200'}`}
                  />
                </div>
                <button
                  onClick={validateCoupon}
                  disabled={!couponCode.trim() || validatingCoupon}
                  className="px-4 py-3 border-2 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white bg-transparent focus:ring-blue-500 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {validatingCoupon ? (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Apply'
                  )}
                </button>
              </div>

              {couponError && (
                <p className="text-sm text-red-600 mt-2">{couponError}</p>
              )}
            </div>
          )}
        </motion.div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
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
                  {appliedCoupon?.is100Percent ? (
                    <>
                      <span className="text-5xl font-bold text-green-600">FREE</span>
                      <div className="ml-4 text-left">
                        <span className="text-2xl text-gray-400 line-through">${plan.originalPrice}</span>
                        <p className="text-sm text-green-600 font-semibold">100% OFF!</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-5xl font-bold text-gray-900">${plan.price}</span>
                      <span className="text-xl text-gray-600 ml-2">{plan.period}</span>
                    </>
                  )}
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
                  appliedCoupon?.is100Percent
                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                    : plan.popular
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg transform hover:-translate-y-1'}`}
              >
                {isLoading && loadingPlan === plan.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>
                      {appliedCoupon?.is100Percent ? 'Activating Free Access...' : 'Starting subscription...'}
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      {appliedCoupon?.is100Percent ? 'Get Free Access' : 'Get Started Now'}
                    </span>
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
          transition={{ delay: 0.5 }}
          className="text-center mt-12 space-y-4"
        >
          <p className="text-gray-600">
            ✅ Cancel anytime • ✅ Secure payment via Stripe • ✅ Instant access
          </p>
          <p className="text-sm text-gray-500">
            Both plans give you complete access to all AskStan features. Choose yearly to save money!
          </p>
          {appliedCoupon?.is100Percent && (
            <p className="text-green-600 font-semibold">
              🎉 With your coupon, you get everything completely FREE!
            </p>
          )}
        </motion.div>

        {/* Money Back Guarantee */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
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