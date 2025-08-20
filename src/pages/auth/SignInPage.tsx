// src/pages/auth/SignInPage.tsx - FIXED: Proper state management and routing
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  submit?: string;
}

export const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, user, hasActiveSubscription, initialized, loading: authLoading } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CRITICAL FIX: Only redirect after auth is fully initialized and we have subscription status
  useEffect(() => {
    // Don't redirect if we're still loading or not initialized
    if (!initialized || authLoading || isSubmitting) {
      return;
    }

    if (user) {
      // Check if there's a redirect location from ProtectedRoute
      const from = (location.state as any)?.from?.pathname;
      
      if (from && from !== '/signin') {
        // User was redirected here from a protected route - go back there
        navigate(from, { replace: true });
      } else {
        // Normal sign-in flow - route based on subscription status
        // Add a small delay to ensure subscription status is loaded
        const timer = setTimeout(() => {
          if (hasActiveSubscription) {
            navigate('/dashboard', { replace: true });
          } else {
            navigate('/plans', { replace: true });
          }
        }, 500);
        
        return () => clearTimeout(timer);
      }
    }
  }, [user, hasActiveSubscription, initialized, authLoading, isSubmitting, navigate, location.state]);

  // CRITICAL FIX: Reset form state when component mounts
  useEffect(() => {
    setIsSubmitting(false);
    setErrors({});
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

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

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // CRITICAL FIX: Prevent double submissions and check current state
    if (isSubmitting || authLoading) {
      console.log("⏸️ Sign in already in progress or auth loading");
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({ submit: undefined });

    try {
      console.log("🔐 Starting sign in process...");
      
      await signIn(formData.email, formData.password);
      
      console.log("✅ Sign in successful - routing will be handled by useEffect");
      // Don't set isSubmitting to false here - let the redirect happen
      
    } catch (error: any) {
      console.error('Sign in failed:', error);
      setErrors({ submit: error.message });
      setIsSubmitting(false); // Only reset on error
    }
  };

  // CRITICAL FIX: If user is already signed in, show loading state
  if (user && initialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  const isLoading = authLoading || isSubmitting;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back!</h1>
          <p className="text-gray-600">Sign in to your AskStan! account</p>
        </motion.div>

        {/* Sign In Form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Email Field */}
          <Input
            type="email"
            label="Email Address"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleInputChange('email')}
            error={errors.email}
            icon={<Mail className="w-5 h-5" />}
            disabled={isLoading}
            required
          />

          {/* Password Field */}
          <Input
            type="password"
            label="Password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleInputChange('password')}
            error={errors.password}
            icon={<Lock className="w-5 h-5" />}
            disabled={isLoading}
            required
          />

          {/* Submit Error */}
          {errors.submit && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </motion.div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            loading={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-yellow-500 hover:from-blue-600 hover:to-yellow-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            disabled={isLoading}
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
            {!isLoading && <ArrowRight className="w-5 h-5 ml-2" />}
          </Button>

          {/* Footer Links */}
          <div className="text-center space-y-4">
            <Link
              to="/forgot-password"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
            >
              Forgot your password?
            </Link>
            
            <div className="border-t pt-4">
              <p className="text-gray-600 text-sm">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Sign up here
                </Link>
              </p>
            </div>
          </div>
        </motion.form>
      </motion.div>
    </div>
  );
};