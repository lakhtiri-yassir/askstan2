// src/pages/auth/SignInPage.tsx - FIXED: Centered layout, email memory, home button
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Home } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, user, initialized, loading, hasActiveSubscription, subscriptionLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load saved email from localStorage on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('askstan_last_email');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
    }
  }, []);

  // FIXED: Smart redirect logic with subscription loading wait
  useEffect(() => {
    // Only attempt redirect when auth is fully initialized and not loading
    if (!initialized || loading) {
      return;
    }

    // If user is already signed in, wait for subscription loading to complete
    if (user) {
      console.log('🔍 SignIn: User already signed in, checking subscription status');
      
      // If subscription is still loading, wait for it to complete
      if (subscriptionLoading) {
        console.log('⏳ SignIn: Waiting for subscription data to load...');
        return;
      }

      // Add a small delay to ensure all data is properly loaded
      const redirectTimer = setTimeout(() => {
        if (hasActiveSubscription) {
          console.log('✅ SignIn: User has subscription, redirecting to dashboard');
          navigate('/dashboard', { replace: true });
        } else {
          console.log('💳 SignIn: User needs subscription, redirecting to plans');
          navigate('/plans', { replace: true });
        }
      }, 500); // 500ms delay to ensure data is fully loaded

      return () => clearTimeout(redirectTimer);
    }
  }, [user, initialized, loading, hasActiveSubscription, subscriptionLoading, navigate]);

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
      
      // Save email to localStorage for future use
      localStorage.setItem('askstan_last_email', formData.email);
      
      await signIn(formData.email, formData.password);
      console.log('✅ SignIn: Sign in successful');
      
      // Note: Redirect will be handled by the useEffect when user state updates
      
    } catch (error: any) {
      console.error('❌ SignIn: Sign in error:', error);
      setErrors({
        submit: error.message || 'Invalid email or password. Please try again.'
      });
      setIsSubmitting(false);
    }
  };

  // Show redirecting state if user is signed in and we're about to redirect
  if (user && initialized && !loading && (!subscriptionLoading || hasActiveSubscription !== undefined)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            {subscriptionLoading ? 'Checking subscription...' : 'Redirecting...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 relative">
      {/* Go Back to Home Button */}
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center text-gray-600 hover:text-blue-600 transition-colors group z-10"
      >
        <Home className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
        <span className="font-medium">Back to Home</span>
      </Link>

      {/* PROPERLY CENTERED CONTAINER */}
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
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

        {/* Sign In Form - Properly Centered */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8 w-full"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                placeholder="Enter your email"
                icon={<Mail className="w-5 h-5" />}
                error={errors.email}
                disabled={isSubmitting}
                autoComplete="email"
                name="email"
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                value={formData.password}
                onChange={handleInputChange('password')}
                placeholder="Enter your password"
                icon={<Lock className="w-5 h-5" />}
                error={errors.password}
                disabled={isSubmitting}
                autoComplete="current-password"
                name="password"
              />
            </div>

            {errors.submit && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
                {errors.submit}
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={isSubmitting}
              disabled={isSubmitting}
              className="flex items-center justify-center"
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
          </form>

          <div className="mt-6 text-center">
            <Link 
              to="/forgot-password" 
              className="text-blue-600 hover:text-blue-700 text-sm transition-colors"
            >
              Forgot your password?
            </Link>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Don't have an account?{' '}
              <Link 
                to="/signup" 
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;