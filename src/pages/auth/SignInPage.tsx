// src/pages/auth/SignInPage.tsx - Fixed with Proper Redirect Logic
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const SignInPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn, user, subscriptionStatus } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle navigation after successful authentication
  useEffect(() => {
    if (user) {
      console.log('User authenticated, checking subscription status:', subscriptionStatus);
      
      // Wait a moment for subscription status to load if it's not available yet
      if (subscriptionStatus === null) {
        console.log('Subscription status still loading, waiting...');
        return;
      }
      
      // Check if user has an active subscription
      const hasActiveSubscription = subscriptionStatus?.status === 'active';
      
      console.log('Subscription check result:', {
        hasActiveSubscription,
        status: subscriptionStatus?.status,
        redirecting: hasActiveSubscription ? 'to dashboard' : 'to plans'
      });
      
      if (hasActiveSubscription) {
        // User has subscription, redirect to dashboard
        const from = location.state?.from?.pathname;
        if (from && from !== '/plans' && from !== '/signin') {
          navigate(from, { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        // User doesn't have subscription, redirect to plans
        navigate('/plans', { replace: true });
      }
    }
  }, [user, subscriptionStatus, navigate, location.state?.from?.pathname]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await signIn(formData.email, formData.password);
      // Navigation will be handled by the useEffect above
    } catch (error: any) {
      console.error('Sign in error:', error);
      setErrors({ 
        submit: error.message || 'Failed to sign in. Please check your credentials.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-block mb-8">
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-yellow-500">
              AskStan!
            </h1>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              icon={<Mail className="w-5 h-5" />}
              placeholder="Enter your email"
              required
            />

            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              icon={<Lock className="w-5 h-5" />}
              placeholder="Enter your password"
              required
            />

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              isLoading={isLoading}
              className="w-full"
            >
              <LogIn className="mr-2 w-5 h-5" />
              Sign In
            </Button>
          </form>

          <div className="mt-6">
            <div className="text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-500 font-medium"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};