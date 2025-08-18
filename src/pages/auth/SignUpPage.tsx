// src/pages/auth/SignUpPage.tsx - FIXED: Icons passed as JSX elements
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
  submit?: string;
}

export const SignUpPage: React.FC = () => {
  // CRITICAL FIX: All hooks must be called at the top level, in the same order every time
  const navigate = useNavigate();
  const { signUp, user } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // CRITICAL FIX: Handle user redirect without early returns
  useEffect(() => {
    if (user) {
      navigate('/plans', { replace: true });
    }
  }, [user, navigate]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!acceptTerms) {
      newErrors.terms = 'You must accept the Terms of Service and Privacy Policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // CRITICAL FIX: Prevent double submissions
    if (isLoading) {
      console.log("⏸️ Sign up already in progress");
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({}); // Clear any previous errors
    
    try {
      console.log("🔐 Starting sign up process...");
      
      await signUp(formData.email, formData.password, formData.fullName);
      
      console.log("✅ Sign up successful");
      // Navigation will be handled by useEffect when user state updates
    } catch (error: any) {
      console.error('Sign up error:', error);
      // Only show errors that are actually meaningful to users
      if (error.message && !error.message.includes('timeout') && !error.message.includes('loading')) {
        setErrors({ 
          submit: error.message
        });
      }
    } finally {
      setIsLoading(false);
    }
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join AskStan!</h1>
          <p className="text-gray-600">Create your account and start growing your social media presence</p>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Input
              type="text"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={handleInputChange('fullName')}
              error={errors.fullName}
              icon={<User />}
              autoComplete="name"
              autoFocus
            />
          </motion.div>

          {/* Email Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Input
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleInputChange('email')}
              error={errors.email}
              icon={<Mail />}
              autoComplete="email"
            />
          </motion.div>

          {/* Password Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Input
              type="password"
              placeholder="Create a password (min. 6 characters)"
              value={formData.password}
              onChange={handleInputChange('password')}
              error={errors.password}
              icon={<Lock />}
              autoComplete="new-password"
            />
          </motion.div>

          {/* Confirm Password Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Input
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleInputChange('confirmPassword')}
              error={errors.confirmPassword}
              icon={<Lock />}
              autoComplete="new-password"
            />
          </motion.div>

          {/* Terms and Conditions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-start space-x-3"
          >
            <input
              type="checkbox"
              id="acceptTerms"
              checked={acceptTerms}
              onChange={(e) => {
                setAcceptTerms(e.target.checked);
                if (errors.terms) {
                  setErrors(prev => ({ ...prev, terms: undefined }));
                }
              }}
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="acceptTerms" className="text-sm text-gray-600">
              I agree to the{' '}
              <a href="/terms" className="text-blue-600 hover:text-blue-800 underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-blue-600 hover:text-blue-800 underline">
                Privacy Policy
              </a>
            </label>
          </motion.div>

          {/* Terms Error */}
          {errors.terms && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm text-center">{errors.terms}</p>
            </div>
          )}

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
            transition={{ delay: 0.7 }}
          >
            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              disabled={isLoading || !acceptTerms}
            >
              {isLoading ? 'Creating Account...' : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </motion.div>
        </form>

        {/* Sign In Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-center"
        >
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link
              to="/signin"
              className="text-blue-600 hover:text-blue-800 font-semibold transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

// CRITICAL FIX: Export as default to match lazy loading expectations
export default SignUpPage;