import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Sparkles, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { subscriptionService } from '../lib/subscriptionService';
import { Button } from '../components/ui/Button';

export const CheckoutSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshSubscription } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  const sessionId = searchParams.get('session_id');
  const planType = searchParams.get('plan') as 'monthly' | 'yearly';
  const couponCode = searchParams.get('coupon');

  useEffect(() => {
    const handleCheckoutSuccess = async () => {
      console.log('🎉 Starting checkout success processing...');
      console.log('Session ID:', sessionId);
      console.log('Plan Type:', planType);
      console.log('Coupon Code:', couponCode);
      
      if (!sessionId) {
        setError('No session ID found');
        setIsProcessing(false);
        return;
      }

      try {
        // Wait for webhook to process (give it more time)
        console.log('⏳ Waiting for webhook to process...');
        await new Promise(resolve => setTimeout(resolve, 5000)); // Increased wait time
        
        // Try to refresh subscription data first
        console.log('🔄 Refreshing subscription data...');
        await refreshSubscription();
        
        // Check if subscription was created by webhook
        const { user } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        const subscriptionCheck = await subscriptionService.checkUserSubscription(user.id);
        console.log('📊 Subscription check result:', subscriptionCheck);
        
        if (subscriptionCheck.hasActiveSubscription) {
          console.log('✅ Subscription found via webhook');
          setIsProcessing(false);
          
          // Auto-redirect to dashboard after 2 seconds
          setTimeout(() => {
            navigate('/dashboard?checkout_success=true');
          }, 2000);
          return;
        }
        
        // If no subscription found, try manual creation
        console.log('⚠️ No subscription found, attempting manual creation...');
        const subscription = await subscriptionService.handleCheckoutSuccess(sessionId);
        
        if (subscription) {
          console.log('✅ Manual subscription creation successful');
          await refreshSubscription();
          setIsProcessing(false);
          
          setTimeout(() => {
            navigate('/dashboard?checkout_success=true');
          }, 2000);
        } else {
          throw new Error('Failed to create subscription record');
        }
        
      } catch (error) {
        console.error('Checkout success handling error:', error);
        setError('Failed to process payment. Please contact support if this persists.');
        setDebugInfo({
          sessionId,
          planType,
          couponCode,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        setIsProcessing(false);
      }
    };

    handleCheckoutSuccess();
  }, [sessionId, refreshSubscription, navigate]);

  // Import supabase for user check
  const { supabase } = require('../lib/supabase');

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-md w-full"
        >
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/20 text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Processing Your Payment
            </h2>
            <p className="text-gray-600">
              Please wait while we confirm your subscription... This may take up to 30 seconds.
            </p>
            {sessionId && (
              <p className="text-xs text-gray-400 mt-4">
                Session: {sessionId.substring(0, 20)}...
              </p>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-md w-full"
        >
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/20 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Payment Processing Error
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            
            {debugInfo && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <h4 className="font-semibold text-gray-900 mb-2">Debug Information:</h4>
                <pre className="text-xs text-gray-600 overflow-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            )}
            
            <div className="space-y-4">
              <Link to="/plans">
                <Button className="w-full">Try Again</Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline" className="w-full">Go to Dashboard</Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const plansConfig = subscriptionService.getPlansConfig();
  const planDetails = {
    monthly: plansConfig.monthly,
    yearly: plansConfig.yearly
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
              <h3 className="font-semibold text-gray-900">
                {currentPlan.name}
                {couponCode && <span className="ml-2 text-green-600">(Free with coupon!)</span>}
              </h3>
            </div>
            <p className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-yellow-500 bg-clip-text text-transparent mb-3">
              {couponCode ? 'FREE' : currentPlan.price}
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
                {couponCode && <span className="block text-green-600">Coupon: {couponCode}</span>}
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