// src/components/layout/Header.tsx - SIMPLE FIX: Bulletproof header
import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, LogOut, Settings, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { shouldLoadChatbot, removeChatbot } from '../../config/chatbot';
import askstanLogo from '../../img/askstanlogo.png';

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { user, signOut, hasActiveSubscription, initialized, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Handle chatbot loading/removal based on current page
  useEffect(() => {
    if (shouldLoadChatbot(location.pathname)) {
      console.log('Loading chatbot for dashboard');
    } else {
      removeChatbot();
    }
  }, [location.pathname]);

  // Don't show header on auth and legal pages
  const isAuthPage = ['/signin', '/signup', '/forgot-password', '/reset-password'].includes(location.pathname);
  const isLegalPage = ['/terms', '/privacy'].includes(location.pathname);
  
  if (isAuthPage || isLegalPage) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      console.log('🔄 Header: Signing out...');
      removeChatbot();
      await signOut();
      console.log('✅ Header: Redirecting to home...');
      navigate('/', { replace: true });
    } catch (error) {
      console.error('❌ Header: Sign out error:', error);
      navigate('/', { replace: true });
    }
  };

  console.log('🔍 Header:', { 
    user: !!user, 
    hasActiveSubscription, 
    initialized,
    loading,
    pathname: location.pathname 
  });

  // SIMPLE: Only show loading if not initialized yet
  if (!initialized) {
    return (
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/90 backdrop-blur-lg shadow-lg border-b border-gray-200 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center">
              <img 
                src={askstanLogo} 
                alt="AskStan! Logo" 
                className="h-8 w-auto"
              />
            </Link>
            <div className="flex items-center space-x-4">
              <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
              <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
            </div>
          </div>
        </div>
      </motion.header>
    );
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white/90 backdrop-blur-lg shadow-lg border-b border-gray-200 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src={askstanLogo} 
              alt="AskStan! Logo" 
              className="h-8 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {user ? (
              // User is logged in
              <>
                {hasActiveSubscription ? (
                  <Link
                    to="/dashboard"
                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <Link
                    to="/plans"
                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                  >
                    Plans
                  </Link>
                )}
                
                <Link
                  to="/settings"
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Settings
                </Link>
                
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              // Not signed in
              <>
                <Link
                  to="/signin"
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link to="/signup">
                  <Button size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 border-t border-gray-200"
          >
            <div className="space-y-4">
              {user ? (
                // User is logged in
                <>
                  {hasActiveSubscription ? (
                    <Link
                      to="/dashboard"
                      className="block text-gray-700 hover:text-blue-600 font-medium transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                  ) : (
                    <Link
                      to="/plans"
                      className="block text-gray-700 hover:text-blue-600 font-medium transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Plans
                    </Link>
                  )}
                  
                  <Link
                    to="/settings"
                    className="block text-gray-700 hover:text-blue-600 font-medium transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  
                  <Button
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleSignOut();
                    }}
                    variant="outline"
                    size="sm"
                    className="flex items-center w-full"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                // Not signed in
                <>
                  <Link
                    to="/signin"
                    className="block text-gray-700 hover:text-blue-600 font-medium transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button size="sm" className="w-full">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
};