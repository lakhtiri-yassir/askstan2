// src/pages/auth/SignInPage.tsx - FIXED: Icons passed as JSX elements
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  // CRITICAL FIX: All hooks must be called at the top level, in the same order every time
  const navigate = useNavigate();
  const { signIn, loading, user } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  
  // CRITICAL FIX: Add local loading state to prevent double submissions
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CRITICAL FIX: Handle user redirect without early returns
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

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
    
    // CRITICAL FIX: Prevent double submissions
    if (isSubmitting || loading) {
      console.log("⏸️ Sign in already in progress");
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({ submit: undefined });

    try {
      console.log("🔐 Starting sign in process...");
      
      await signIn(formData.email, formData.password);
      
      console.log("✅ Sign in successful, redirecting...");
      // Navigation will be handled by useEffect when user state updates
    } catch (error: any) {
      console.error('Sign in failed:', error);
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // CRITICAL FIX: Combined loading state
  const isLoading = loading || isSubmitting;

  // CRITICAL FIX: Always render the same component structure
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
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
              icon={<Mail />}
              autoComplete="email"
              autoFocus
            />
          </motion.div>

          {/* Password Field */}
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
              icon={<Lock />}
              autoComplete="current-password"
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
              isLoading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </motion.div>
        </form>

        {/* Forgot Password Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center"
        >
          <Link
            to="/forgot-password"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          >
            Forgot your password?
          </Link>
        </motion.div>

        {/* Sign Up Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center"
        >
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-blue-600 hover:text-blue-800 font-semibold transition-colors"
            >
              Sign up here
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

// CRITICAL FIX: Export as default to match lazy loading expectations
export default SignInPage;