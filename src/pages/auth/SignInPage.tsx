// src/pages/auth/SignInPage.tsx - FIXED: Proper subscription-based redirect
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, user, hasActiveSubscription, initialized } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // FIXED: Handle redirect when user signs in with proper subscription check
  useEffect(() => {
    if (user && initialized) {
      console.log('🔍 SignIn redirect logic:', { 
        user: !!user, 
        hasActiveSubscription, 
        initialized 
      });

      // CRITICAL FIX: Use a longer timeout to ensure subscription status is loaded
      const timer = setTimeout(() => {
        if (hasActiveSubscription) {
          console.log('✅ User has active subscription, redirecting to dashboard');
          navigate('/dashboard', { replace: true });
        } else {
          console.log('💳 User has no active subscription, redirecting to plans');
          navigate('/plans', { replace: true });
        }
      }, 1500); // Increased timeout to ensure subscription data is loaded

      return () => clearTimeout(timer);
    }
  }, [user, hasActiveSubscription, initialized, navigate]);

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
      console.log('🔐 Attempting sign in...');
      await signIn(formData.email, formData.password);
      // Redirect will be handled by useEffect once user and subscription data load
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      setErrors({
        submit: error.message || 'Invalid email or password. Please try again.'
      });
      setIsSubmitting(false);
    }
  };

  // If user is already signed in and we're still loading, show loading state
  if (user && !initialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back!
          </h2>
          <p className="text-gray-600">
            Sign in to your AskStan! account
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <Input
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                error={errors.email}
                icon={Mail}
                placeholder="Enter your email"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <Input
                label="Password"
                type="password"
                value={formData.password}
                onChange={handleInputChange('password')}
                error={errors.password}
                icon={Lock}
                placeholder="Enter your password"
                required
              />
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
                {errors.submit}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full flex items-center justify-center"
              loading={isSubmitting}
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
          className="text-center"
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

// CRITICAL FIX: Export as default to match lazy loading expectations  
export default SignInPage;