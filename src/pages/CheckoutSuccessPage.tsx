import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

export const CheckoutSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { updateSubscription } = useAuth();
  
  const sessionId = searchParams.get('session_id');
  const planType = searchParams.get('plan') as 'monthly' | 'yearly';

  useEffect(() => {
    // Update subscription status when payment is successful
    if (planType && (planType === 'monthly' || planType === 'yearly')) {
      updateSubscription(planType);
    }
  }, [planType, updateSubscription]);

  const planDetails = {
    monthly: {
      name: 'Monthly Plan',
      price: '$4.99/month',
      features: ['AI-powered coaching', 'Multi-platform support', '24/7 chat support']
    },
    yearly: {
      name: 'Yearly Plan', 
      price: '$49.99/year',
      features: ['Everything in Monthly', 'Priority responses', 'Advanced analytics', 'Custom strategies']
    }
  };

  const currentPlan = planType ? planDetails[planType] : planDetails.monthly;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-md w-full"
      >
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/20 text-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-xl mb-6"
          >
            <CheckCircle className="w-12 h-12 text-green-600" />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to AskStan!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Your payment was successful! You now have access to all premium features.
          </p>

          <div className="bg-gradient-to-r from-blue-50 to-yellow-50 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-blue-500 mr-2" />
              <h3 className="font-semibold text-gray-900">{currentPlan.name}</h3>
            </div>
            <p className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-yellow-500 bg-clip-text text-transparent mb-3">
              {currentPlan.price}
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              {currentPlan.features.map((feature, index) => (
                <li key={index} className="flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {sessionId && (
            <div className="bg-gray-50 rounded-lg p-3 mb-6">
              <p className="text-xs text-gray-500">
                Session ID: {sessionId.substring(0, 20)}...
              </p>
            </div>
          )}
          
          <div className="space-y-4">
            <Link to="/dashboard">
              <Button size="lg" className="w-full">
                Start Growing Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            
            <Link to="/settings">
              <Button variant="outline" className="w-full">
                Manage Subscription
              </Button>
            </Link>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Need help? Contact our support team anytime.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};