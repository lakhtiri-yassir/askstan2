// src/components/layout/Header.tsx - FIXED: Proper loading logic
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import askstanLogo from '../../img/askstanlogo.png';

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { user, hasActiveSubscription, loading, signOut } = useAuth();
  const location = useLocation();

  // Don't show header on auth and legal pages
  const isAuthPage = ['/signin', '/signup', '/forgot-password', '/reset-password'].includes(location.pathname);
  const isLegalPage = ['/terms', '/privacy'].includes(location.pathname);
  
  if (isAuthPage || isLegalPage) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      window.location.href = '/';
    }
  };

  // Debug info for header
  const headerDebug = { user: !!user, hasActiveSubscription, loading, pathname: location.pathname };

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

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {loading ? (
              // Show loading only during initial auth load
              <div className="flex items-center">
                <LoadingSpinner size="sm" />
                <span className="ml-2 text-sm text-gray-600">Loading...</span>
              </div>
            ) : user ? (
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
              {loading ? (
                <div className="flex items-center justify-center py-2">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2 text-sm text-gray-600">Loading...</span>
                </div>
              ) : user ? (
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