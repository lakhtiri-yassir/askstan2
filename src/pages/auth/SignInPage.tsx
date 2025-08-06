// src/pages/auth/SignInPage.tsx - FIXED VERSION
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
  
  const { signIn, user, loading, isAuthenticating } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // NEW: Handle navigation after successful authentication
  useEffect(() => {
    // Only navigate if user is authenticated, not loading, and not authenticating
    if (user && !loading && !isAuthenticating) {
      const from = location.state?.from?.pathname || '/dashboard';
      console.log('Authentication complete, navigating to:', from);
      navigate(from, { replace: true });
    }
  }, [user, loading, isAuthenticating, navigate, location.state?.from?.pathname]);

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
      
      // Navigation is now handled by useEffect above
      // Don't navigate here to prevent race conditions
      console.log('Sign in successful, waiting for navigation...');
      
    } catch (error) {
      setErrors({ submit: 'Invalid email or password' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-md w-full"
      >
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-royal-blue rounded-xl mb-4"
            >
              <LogIn className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600">
              Sign in to continue your growth journey
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                label="Email Address"
                type="email"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                icon={<Mail size={20} />}
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                name="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                icon={<Lock size={20} />}
                placeholder="Enter your password"
                required
              />
            </div>

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{errors.submit}</p>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              isLoading={isLoading || loading || isAuthenticating}
              loadingText="Signing in..."
            >
              Sign In
            </Button>

            <div className="flex items-center justify-between text-sm">
              <Link
                to="/forgot-password"
                className="text-royal-blue hover:text-powder-blue transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-semibold text-royal-blue hover:text-powder-blue transition-colors"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};