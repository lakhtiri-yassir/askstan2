// src/pages/admin/AdminLoginPage.tsx - FIXED: Proper state management
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, ArrowLeft } from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const AdminLoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  
  const { signIn, admin, isLoading: adminLoading } = useAdminAuth();
  const navigate = useNavigate();

  // CRITICAL FIX: Redirect logic with proper state checking
  useEffect(() => {
    // Don't redirect if we're still loading admin state or already redirected
    if (adminLoading || isLoading || hasRedirected) {
      return;
    }

    if (admin) {
      setHasRedirected(true);
      // Add small delay to ensure state is fully loaded
      const timer = setTimeout(() => {
        navigate('/admin', { replace: true });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [admin, adminLoading, isLoading, hasRedirected, navigate]);

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
    
    // CRITICAL FIX: Only prevent submission if actually loading
    if (isLoading) {
      console.log("⏸️ Admin login already in progress");
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      console.log("🔐 Starting admin login...");
      await signIn(formData.email, formData.password);
      console.log("✅ Admin login successful - redirect will be handled by useEffect");
      // The useEffect will handle the redirect when admin state updates
    } catch (error: any) {
      console.error('❌ Admin login error:', error);
      setErrors({ 
        submit: error.message || 'Login failed. Please check your credentials.'
      });
      setIsLoading(false); // Reset on error to allow retry
    }
    // Note: Don't set isLoading to false on success - let the redirect happen
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

  // CRITICAL FIX: If admin is already logged in and redirecting, show loading state
  if (admin && hasRedirected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to admin dashboard...</p>
        </div>
      </div>
    );
  }

  // CRITICAL FIX: Only disable form when actually loading
  const isFormDisabled = isLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center p-4">
      {/* Back to Site Button - Top Left */}
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center text-gray-600 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Site
      </Link>

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
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Access</h1>
          <p className="text-gray-600">Sign in to the admin dashboard</p>
        </motion.div>

        {/* Login Form */}
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
            label="Admin Email"
            placeholder="Enter your admin email"
            value={formData.email}
            onChange={handleInputChange('email')}
            error={errors.email}
            icon={<Mail className="w-5 h-5" />}
            disabled={isFormDisabled}
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
            disabled={isFormDisabled}
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
            loading={isFormDisabled}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            disabled={isFormDisabled}
          >
            {isLoading ? 'Signing In...' : 'Access Admin Dashboard'}
            {!isFormDisabled && <LogIn className="w-5 h-5 ml-2" />}
          </Button>
        </motion.form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Authorized personnel only
          </p>
        </div>
      </motion.div>
    </div>
  );
};