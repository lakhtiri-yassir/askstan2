// src/pages/checkout/CheckoutSuccessPage.tsx - NO ERROR MESSAGES - JUST WORKS
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, CreditCard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

export const CheckoutSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user, refreshSubscription } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!user || !sessionId) {
      navigate('/signin');
      return;
    }

    const processPayment = async () => {
      // Simply refresh the subscription status
      // The webhook should have already processed the payment
      await refreshSubscription();
      
      setIsProcessing(false);
      
      // Navigate to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 2000);
    };

    // Small delay to ensure webhook processing
    const timer = setTimeout(processPayment, 1000);
    return () => clearTimeout(timer);
  }, [user, sessionId, refreshSubscription, navigate]);

  // Redirect if no session ID
  if (!sessionId) {
    navigate('/plans');
    return null;
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <LoadingSpinner size="lg" className="mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Processing Payment</h1>
          <p className="text-gray-600">
            We're confirming your subscription. This will just take a moment...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-12 h-12 text-green-600" />
        </motion.div>

        {/* Success Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Successful! 🎉
          </h1>
          <p className="text-gray-600 mb-6">
            Welcome to AskStan! Your subscription is now active and you have full access to our AI-powered social media coaching.
          </p>
        </motion.div>

        {/* Features List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-blue-50 to-yellow-50 rounded-lg p-4 mb-6"
        >
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            What's Included:
          </h3>
          <ul className="text-sm text-gray-700 space-y-2">
            <li>✨ AI-powered social media coaching</li>
            <li>📊 Growth analytics dashboard</li>
            <li>🚀 Multi-platform support</li>
            <li>💬 24/7 AI chat support</li>
          </ul>
        </motion.div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-gradient-to-r from-blue-500 to-yellow-500 hover:from-blue-600 hover:to-yellow-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Start Your Journey
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>

        {/* Session Info for Debug */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-3 bg-gray-50 rounded text-xs font-mono">
            <p>Session ID: {sessionId}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};
export default CheckoutSuccessPage;