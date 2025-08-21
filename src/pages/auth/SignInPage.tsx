// src/pages/auth/SignInPage.tsx - FIXED: Proper redirect timing and logic
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, user, hasActiveSubscription, initialized, loading } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // FIXED: Improved redirect logic with proper timing
  useEffect(() => {
    // Only attempt redirect when auth is fully initialized and not loading
    if (!initialized || loading) {
      return;
    }

    // If user is already signed in, redirect them appropriately
    if (user) {
      console.log('🔍 SignIn: User already signed in, redirecting based on subscription', {
        hasActiveSubscription,
        userEmail: user.email
      });

      // Use a timeout to ensure subscription data is fully loaded
      const redirectTimer = setTimeout(() => {
        if (hasActiveSubscription) {
          console.log('✅ SignIn: User has active subscription, redirecting to dashboard');
          navigate('/dashboard', { replace: true });
        } else {
          console.log('💳 SignIn: User needs subscription, redirecting to plans');
          navigate('/plans', { replace: true });
        }
      }, 100); // Small delay to ensure subscription status is determined

      return () => clearTimeout(redirectTimer);
    }
  }, [user, hasActiveSubscription, initialized, loading, navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || !validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      console.log('🔐 SignIn: Attempting sign in...');
      await signIn(formData.email, formData.password);
      console.log('✅ SignIn: Sign in successful, redirect will be handled by useEffect');
      
      // Note: Don't manually redirect here - let the useEffect handle it
      // once the auth state updates and subscription data loads
      
    } catch (error: any) {
      console.error('❌ SignIn: Sign in error:', error);
      setErrors({
        submit: error.message || 'Invalid email or password. Please try again.'
      });
      setIsSubmitting(false);
    }
  };

  // Don't render form if user is already signed in and we're about to redirect
  if (user && initialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back!</h1>
          <p className="text-gray-600">Sign in to continue your social media growth journey</p>
        </motion.div>

        {/* Sign In Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-200"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Input
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange('email')}
                error={errors.email}
                icon={<Mail className="w-5 h-5" />}
                label="Email Address"
              />
            </motion.div>

            {/* Password Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Input
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange('password')}
                error={errors.password}
                icon={<Lock className="w-5 h-5" />}
                label="Password"
              />
            </motion.div>

            {/* Submit Error */}
            {errors.submit && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 border border-red-200 rounded-lg p-3"
              >
                <p className="text-red-700 text-sm text-center">{errors.submit}</p>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                type="submit"
                className="w-full"
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  'Signing In...'
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </motion.div>

            {/* Forgot Password Link */}
            <div className="text-center">
              <Link
                to="/forgot-password"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
              >
                Forgot your password?
              </Link>
            </div>
          </form>
        </motion.div>

        {/* Sign Up Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mt-6"
        >
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Sign up for free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SignInPage;